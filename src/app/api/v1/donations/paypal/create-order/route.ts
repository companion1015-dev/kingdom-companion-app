import { NextRequest } from 'next/server'
import { withOptionalAuth } from '@/lib/auth/middleware'
import { successResponse, errorResponse, serverErrorResponse } from '@/lib/api-response'
import { checkRateLimit, getRateLimitKey } from '@/lib/auth/rate-limit'
import { prisma } from '@/lib/db/client'

// POST /api/v1/donations/paypal/create-order
// Real PayPal Orders API v2 integration. PAYPAL_MODE defaults to "sandbox"
// -- set to "live" once the ministry's real PayPal business account and
// live credentials are in place. Demo mode (no credentials configured)
// mirrors the Stripe route's honesty pattern rather than faking a response.

const DONATION_RATE = { limit: 10, windowMs: 60 * 60 * 1000 }

function paypalBase() {
  return process.env.PAYPAL_MODE === 'live'
    ? 'https://api-m.paypal.com'
    : 'https://api-m.sandbox.paypal.com'
}

async function getPayPalAccessToken(): Promise<string | null> {
  const clientId     = process.env.PAYPAL_CLIENT_ID
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET
  if (!clientId || !clientSecret) return null

  const res = await fetch(`${paypalBase()}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
      'Content-Type':  'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  })
  if (!res.ok) return null
  const data = await res.json()
  return data.access_token ?? null
}

export const POST = withOptionalAuth(async (req: NextRequest, user) => {
  const ip = req.headers.get('x-forwarded-for') ?? 'unknown'
  const { allowed } = checkRateLimit(getRateLimitKey('donation-paypal', ip), DONATION_RATE)
  if (!allowed) return errorResponse('RATE_LIMITED', 'Too many requests. Please try again later.', 429)

  try {
    const body = await req.json()
    const { amount_cents, currency = 'USD', frequency = 'one_time', dedication_type, dedication_name,
      donor_display_name, is_anonymous, hide_amount, wants_receipt, wants_updates, donor_email } = body

    if (!amount_cents || amount_cents < 100) return errorResponse('INVALID_AMOUNT', 'Please provide a valid donation amount.', 400)

    if (frequency !== 'one_time') {
      return errorResponse('UNSUPPORTED', 'Recurring giving via PayPal requires billing plans set up in the PayPal dashboard first -- not yet configured. Please use a card for recurring gifts, or give a one-time gift via PayPal.', 400)
    }

    const accessToken = await getPayPalAccessToken()

    if (!accessToken) {
      console.log('[Donations] No PayPal credentials — returning demo response')
      return successResponse({ order_id: 'demo_order_' + Date.now(), demo_mode: true }, 'PayPal order created (demo mode).')
    }

    const amountValue = (amount_cents / 100).toFixed(2)
    const orderRes = await fetch(`${paypalBase()}/v2/checkout/orders`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        intent: 'CAPTURE',
        purchase_units: [{ amount: { currency_code: currency.toUpperCase(), value: amountValue }, description: 'Kingdom Companion — Thank you for supporting this ministry' }],
      }),
    })
    if (!orderRes.ok) { console.error('[Donations] PayPal order error:', await orderRes.json()); return errorResponse('PAYMENT_ERROR', 'Unable to create PayPal order. Please try again.', 500) }
    const order = await orderRes.json()

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (prisma as any).donationRecord.create({
      data: {
        user_id: user?.id ?? null,
        payment_provider: 'paypal',
        provider_ref: order.id,
        amount_cents, currency, frequency: 'one_time', status: 'pending',
        dedication_type: dedication_type ?? null, dedication_name: dedication_name ?? null,
        donor_display_name: is_anonymous ? null : (donor_display_name ?? null),
        is_anonymous: !!is_anonymous, hide_amount: !!hide_amount,
        wants_receipt: wants_receipt !== false, wants_updates: !!wants_updates,
        donor_email: donor_email ?? null,
        country_code: req.headers.get('x-vercel-ip-country') ?? null,
      },
    })

    return successResponse({ order_id: order.id }, 'PayPal order created successfully.')
  } catch (error) {
    console.error('[Donations] PayPal create-order error:', error)
    return serverErrorResponse()
  }
})