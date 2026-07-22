import { NextRequest } from 'next/server'
import { successResponse, errorResponse, serverErrorResponse } from '@/lib/api-response'
import { checkRateLimit, getRateLimitKey } from '@/lib/auth/rate-limit'

// Rate limit: 10 payment intents per hour per IP
const DONATION_RATE = { limit: 10, windowMs: 60 * 60 * 1000 }

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for') ?? 'unknown'

  // Rate limiting — prevent abuse
  const { allowed } = checkRateLimit(getRateLimitKey('donation', ip), DONATION_RATE)
  if (!allowed) {
    return errorResponse('RATE_LIMITED', 'Too many requests. Please try again later.', 429)
  }

  try {
    const body = await req.json()
    const { amount_cents, currency = 'USD', frequency = 'one_time' } = body

    // Validation
    if (!amount_cents || typeof amount_cents !== 'number') {
      return errorResponse('INVALID_AMOUNT', 'Please provide a valid donation amount.', 400)
    }
    if (amount_cents < 100) {  // Minimum $1.00
      return errorResponse('AMOUNT_TOO_SMALL', 'Minimum donation is $1.00.', 400)
    }
    if (amount_cents > 1000000) {  // Maximum $10,000
      return errorResponse('AMOUNT_TOO_LARGE', 'Maximum donation is $10,000.', 400)
    }

    const stripeKey = process.env.STRIPE_SECRET_KEY

    // No Stripe key — return demo mode response
    if (!stripeKey) {
      console.log('[Donations] No STRIPE_SECRET_KEY — returning demo response')
      return successResponse({
        client_secret:     'demo_secret_' + Date.now(),
        payment_intent_id: 'demo_pi_' + Date.now(),
        demo_mode:         true,
      }, 'Payment intent created (demo mode).')
    }

    // Create Stripe PaymentIntent
    const stripeRes = await fetch('https://api.stripe.com/v1/payment_intents', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${stripeKey}`,
        'Content-Type':  'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        amount:               String(amount_cents),
        currency:             currency.toLowerCase(),
        'automatic_payment_methods[enabled]': 'true',
        description:          'Kingdom Companion — Thank you for supporting this ministry',
        'metadata[frequency]':frequency,
        'metadata[source]':   'kingdom-companion-app',
      }),
    })

    if (!stripeRes.ok) {
      const err = await stripeRes.json()
      console.error('[Donations] Stripe error:', err)
      return errorResponse('PAYMENT_ERROR', 'Unable to process payment. Please try again.', 500)
    }

    const intent = await stripeRes.json()

    return successResponse({
      client_secret:     intent.client_secret,
      payment_intent_id: intent.id,
    }, 'Payment intent created successfully.')

  } catch (error) {
    console.error('[Donations] Error:', error)
    return serverErrorResponse()
  }
}
