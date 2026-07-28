import { NextRequest } from 'next/server'
import crypto from 'crypto'
import { prisma } from '@/lib/db/client'

// POST /api/v1/donations/webhook
// Real Stripe webhook signature verification, implemented manually against
// Stripe's documented algorithm (HMAC-SHA256 of "timestamp.payload" using
// the webhook signing secret) rather than the placeholder that previously
// existed here -- that version accepted any POST with a signature header
// present, without ever actually checking it, which meant anyone could
// forge a "payment succeeded" event.
// Also fixed: the old handler always created a new DonationRecord, when
// create-intent already creates one in "pending" status -- this now
// updates that same record by provider_ref rather than duplicating it.

function verifyStripeSignature(payload: string, sigHeader: string, secret: string): boolean {
  const parts = Object.fromEntries(sigHeader.split(',').map(p => p.split('=')) as [string, string][])
  const timestamp = parts.t
  const signature = parts.v1
  if (!timestamp || !signature) return false

  const expected = crypto.createHmac('sha256', secret).update(`${timestamp}.${payload}`).digest('hex')

  const age = Math.abs(Date.now() / 1000 - Number(timestamp))
  if (age > 300) return false

  try {
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature))
  } catch {
    return false
  }
}

export async function POST(req: NextRequest) {
  const body      = await req.text()
  const signature = req.headers.get('stripe-signature')
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

  if (!webhookSecret || !signature) {
    console.warn('[Webhook] Missing webhook secret or signature')
    return new Response('Webhook configuration error', { status: 400 })
  }

  if (!verifyStripeSignature(body, signature, webhookSecret)) {
    console.warn('[Webhook] Signature verification failed')
    return new Response('Invalid signature', { status: 400 })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = prisma as any

  try {
    const event = JSON.parse(body) as { type: string; data: { object: Record<string, unknown> } }

    switch (event.type) {

      case 'payment_intent.succeeded': {
        const intent = event.data.object
        await db.donationRecord.updateMany({
          where: { provider_ref: String(intent.id ?? '') },
          data:  { status: 'succeeded' },
        })
        console.log('[Webhook] Donation succeeded:', intent.id)
        break
      }

      case 'payment_intent.payment_failed': {
        const intent = event.data.object
        await db.donationRecord.updateMany({
          where: { provider_ref: String(intent.id ?? '') },
          data:  { status: 'failed' },
        })
        break
      }

      case 'charge.refunded': {
        const charge = event.data.object
        const paymentIntentId = String(charge.payment_intent ?? '')
        if (paymentIntentId) {
          await db.donationRecord.updateMany({
            where: { provider_ref: paymentIntentId },
            data:  { status: 'refunded' },
          })
        }
        console.log('[Webhook] Refund processed:', paymentIntentId)
        break
      }

      case 'invoice.paid': {
        const invoice = event.data.object
        const subscriptionId = String(invoice.subscription ?? '')
        if (!subscriptionId) break

        const sub = await db.donationSubscription.findUnique({ where: { provider_subscription_id: subscriptionId } })
        if (!sub) { console.warn('[Webhook] invoice.paid for unknown subscription:', subscriptionId); break }

        await db.donationRecord.create({
          data: {
            user_id: sub.user_id,
            payment_provider: 'stripe',
            provider_ref: String(invoice.id ?? ''),
            amount_cents: Number(invoice.amount_paid ?? 0),
            currency: String(invoice.currency ?? 'usd').toUpperCase(),
            frequency: sub.frequency,
            status: 'succeeded',
            dedication_type: sub.dedication_type,
            dedication_name: sub.dedication_name,
            donor_display_name: sub.donor_display_name,
            is_anonymous: sub.is_anonymous,
            donor_email: sub.donor_email,
            subscription_id: sub.id,
          },
        })
        console.log('[Webhook] Recurring donation recorded for subscription:', subscriptionId)
        break
      }

      case 'customer.subscription.deleted': {
        const sub = event.data.object
        await db.donationSubscription.updateMany({
          where: { provider_subscription_id: String(sub.id ?? '') },
          data:  { status: 'cancelled', cancelled_at: new Date() },
        })
        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object
        const subscriptionId = String(invoice.subscription ?? '')
        if (subscriptionId) {
          await db.donationSubscription.updateMany({
            where: { provider_subscription_id: subscriptionId },
            data:  { status: 'past_due' },
          })
        }
        break
      }

      default:
        break
    }

    return new Response('OK', { status: 200 })

  } catch (error) {
    console.error('[Webhook] Error processing event:', error)
    return new Response('Webhook error', { status: 400 })
  }
}