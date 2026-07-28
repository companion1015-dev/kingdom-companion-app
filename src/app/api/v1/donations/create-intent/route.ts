import { NextRequest } from 'next/server'
import { withOptionalAuth } from '@/lib/auth/middleware'
import { successResponse, errorResponse, serverErrorResponse } from '@/lib/api-response'
import { checkRateLimit, getRateLimitKey } from '@/lib/auth/rate-limit'
import { prisma } from '@/lib/db/client'

// Rate limit: 10 payment intents per hour per IP
const DONATION_RATE = { limit: 10, windowMs: 60 * 60 * 1000 }

// Stripe only supports day | week | month | year intervals natively --
// "quarterly" is represented honestly as interval: month, interval_count: 3
// rather than inventing an interval Stripe doesn't have.
const FREQUENCY_TO_STRIPE_INTERVAL: Record<string, { interval: string; interval_count: number }> = {
  monthly:   { interval: 'month', interval_count: 1 },
  quarterly: { interval: 'month', interval_count: 3 },
  annual:    { interval: 'year',  interval_count: 1 },
}

export const POST = withOptionalAuth(async (req: NextRequest, user) => {
  const ip = req.headers.get('x-forwarded-for') ?? 'unknown'
  const { allowed } = checkRateLimit(getRateLimitKey('donation', ip), DONATION_RATE)
  if (!allowed) return errorResponse('RATE_LIMITED', 'Too many requests. Please try again later.', 429)

  try {
    const body = await req.json()
    const {
      amount_cents, currency = 'USD', frequency = 'one_time',
      dedication_type, dedication_name,
      donor_display_name, is_anonymous, hide_amount, wants_receipt, wants_updates, donor_email,
    } = body

    if (!amount_cents || typeof amount_cents !== 'number') {
      return errorResponse('INVALID_AMOUNT', 'Please provide a valid donation amount.', 400)
    }
    if (amount_cents < 100) return errorResponse('AMOUNT_TOO_SMALL', 'Minimum donation is $1.00.', 400)
    if (amount_cents > 1000000) return errorResponse('AMOUNT_TOO_LARGE', 'Maximum donation is $10,000.', 400)

    const country_code = req.headers.get('x-vercel-ip-country') ?? null
    const stripeKey = process.env.STRIPE_SECRET_KEY

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = prisma as any
    const donorFields = {
      user_id: user?.id ?? null,
      dedication_type: dedication_type ?? null,
      dedication_name: dedication_name ?? null,
      donor_display_name: is_anonymous ? null : (donor_display_name ?? null),
      is_anonymous: !!is_anonymous,
      hide_amount: !!hide_amount,
      wants_receipt: wants_receipt !== false,
      wants_updates: !!wants_updates,
      donor_email: donor_email ?? null,
      country_code,
    }

    if (!stripeKey) {
      console.log('[Donations] No STRIPE_SECRET_KEY — returning demo response')
      return successResponse({
        client_secret:     'demo_secret_' + Date.now(),
        payment_intent_id: 'demo_pi_' + Date.now(),
        demo_mode:         true,
      }, 'Payment intent created (demo mode).')
    }

    // ─── RECURRING: real Stripe Subscription, not a label ───────────────────
    if (frequency !== 'one_time') {
      const interval = FREQUENCY_TO_STRIPE_INTERVAL[frequency]
      if (!interval) return errorResponse('INVALID_FREQUENCY', 'Unsupported giving frequency.', 400)

      // A Customer is required for subscriptions (unlike one-time PaymentIntents).
      const customerRes = await fetch('https://api.stripe.com/v1/customers', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${stripeKey}`, 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          ...(donor_email ? { email: donor_email } : {}),
          'metadata[source]': 'kingdom-companion-app',
        }),
      })
      if (!customerRes.ok) { console.error('[Donations] Stripe customer error:', await customerRes.json()); return errorResponse('PAYMENT_ERROR', 'Unable to set up recurring giving. Please try again.', 500) }
      const customer = await customerRes.json()

      const subRes = await fetch('https://api.stripe.com/v1/subscriptions', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${stripeKey}`, 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          customer: customer.id,
          'items[0][price_data][currency]': currency.toLowerCase(),
          'items[0][price_data][unit_amount]': String(amount_cents),
          'items[0][price_data][recurring][interval]': interval.interval,
          'items[0][price_data][recurring][interval_count]': String(interval.interval_count),
          'items[0][price_data][product_data][name]': 'Kingdom Companion — Recurring Gift',
          payment_behavior: 'default_incomplete',
          'payment_settings[save_default_payment_method]': 'on_subscription',
          'expand[0]': 'latest_invoice.payment_intent',
          'metadata[frequency]': frequency,
          'metadata[source]': 'kingdom-companion-app',
        }),
      })
      if (!subRes.ok) { console.error('[Donations] Stripe subscription error:', await subRes.json()); return errorResponse('PAYMENT_ERROR', 'Unable to set up recurring giving. Please try again.', 500) }
      const subscription = await subRes.json()
      const paymentIntent = subscription.latest_invoice?.payment_intent

      const subRecord = await db.donationSubscription.create({
        data: {
          ...donorFields,
          payment_provider: 'stripe',
          provider_subscription_id: subscription.id,
          amount_cents, currency, frequency,
          status: 'active',
        },
        select: { id: true },
      })

      return successResponse({
        client_secret:     paymentIntent?.client_secret,
        subscription_id:   subscription.id,
        donation_subscription_id: subRecord.id,
      }, 'Recurring gift set up successfully.')
    }

    // ─── ONE-TIME ─────────────────────────────────────────────────────────────
    const stripeRes = await fetch('https://api.stripe.com/v1/payment_intents', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${stripeKey}`, 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        amount:               String(amount_cents),
        currency:             currency.toLowerCase(),
        'automatic_payment_methods[enabled]': 'true',
        description:          'Kingdom Companion — Thank you for supporting this ministry',
        'metadata[frequency]':frequency,
        'metadata[source]':   'kingdom-companion-app',
      }),
    })
    if (!stripeRes.ok) { console.error('[Donations] Stripe error:', await stripeRes.json()); return errorResponse('PAYMENT_ERROR', 'Unable to process payment. Please try again.', 500) }
    const intent = await stripeRes.json()

    await db.donationRecord.create({
      data: {
        ...donorFields,
        payment_provider: 'stripe',
        provider_ref: intent.id,
        amount_cents, currency, frequency,
        status: 'pending',
      },
    })

    return successResponse({
      client_secret:     intent.client_secret,
      payment_intent_id: intent.id,
    }, 'Payment intent created successfully.')

  } catch (error) {
    console.error('[Donations] Error:', error)
    return serverErrorResponse()
  }
})