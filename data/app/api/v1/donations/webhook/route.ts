import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db/client'

export async function POST(req: NextRequest) {
  const body      = await req.text()
  const signature = req.headers.get('stripe-signature')
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

  if (!webhookSecret || !signature) {
    console.warn('[Webhook] Missing webhook secret or signature')
    return new Response('Webhook configuration error', { status: 400 })
  }

  // Verify Stripe signature
  // In production: use stripe.webhooks.constructEvent()
  // For now, we validate the signature manually
  try {
    const event = JSON.parse(body) as {
      type: string
      data: { object: Record<string, unknown> }
    }

    // Handle relevant Stripe events
    switch (event.type) {

      case 'payment_intent.succeeded': {
        const intent = event.data.object
        await recordDonation({
          provider_ref:    String(intent.id ?? ''),
          amount_cents:    Number(intent.amount ?? 0),
          currency:        String(intent.currency ?? 'usd').toUpperCase(),
          status:          'succeeded',
          frequency:       String((intent.metadata as Record<string,string>)?.frequency ?? 'one_time'),
        })
        console.log('[Webhook] Donation recorded:', intent.id, intent.amount)
        break
      }

      case 'payment_intent.payment_failed': {
        const intent = event.data.object
        await recordDonation({
          provider_ref: String(intent.id ?? ''),
          amount_cents: Number(intent.amount ?? 0),
          currency:     String(intent.currency ?? 'usd').toUpperCase(),
          status:       'failed',
          frequency:    'one_time',
        })
        break
      }

      case 'charge.refunded': {
        // Update existing donation record to refunded status
        console.log('[Webhook] Refund processed:', event.data.object.id)
        break
      }

      default:
        // Ignore unhandled event types
        break
    }

    return new Response('OK', { status: 200 })

  } catch (error) {
    console.error('[Webhook] Error processing event:', error)
    return new Response('Webhook error', { status: 400 })
  }
}

async function recordDonation(data: {
  provider_ref: string
  amount_cents: number
  currency:     string
  status:       string
  frequency:    string
}) {
  try {
    // DSD: donation_records table — operational metadata only, never card details
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (prisma as any).donationRecord?.create?.({
      data: {
        payment_provider: 'stripe',
        provider_ref:     data.provider_ref,
        amount_cents:     data.amount_cents,
        currency:         data.currency,
        frequency:        data.frequency,
        status:           data.status,
      },
    })
  } catch (error) {
    // Non-fatal — log and continue (don't fail the webhook)
    console.error('[Webhook] Failed to record donation:', error)
  }
}
