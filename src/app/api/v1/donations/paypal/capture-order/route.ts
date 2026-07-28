import { NextRequest } from 'next/server'
import { successResponse, errorResponse, serverErrorResponse } from '@/lib/api-response'
import { prisma } from '@/lib/db/client'

// POST /api/v1/donations/paypal/capture-order
// Called after the donor approves payment on PayPal's side. Captures the
// actual funds and updates our DonationRecord accordingly.

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

export async function POST(req: NextRequest) {
  try {
    const { order_id } = await req.json()
    if (!order_id) return errorResponse('MISSING_ID', 'order_id is required.', 400)

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = prisma as any

    if (order_id.startsWith('demo_order_')) {
      await db.donationRecord.updateMany({ where: { provider_ref: order_id }, data: { status: 'succeeded' } })
      return successResponse({ status: 'COMPLETED', demo_mode: true }, 'Donation completed (demo mode). Thank you!')
    }

    const accessToken = await getPayPalAccessToken()
    if (!accessToken) return errorResponse('PAYMENT_ERROR', 'PayPal is not configured.', 500)

    const captureRes = await fetch(`${paypalBase()}/v2/checkout/orders/${order_id}/capture`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
    })

    if (!captureRes.ok) {
      console.error('[Donations] PayPal capture error:', await captureRes.json())
      await db.donationRecord.updateMany({ where: { provider_ref: order_id }, data: { status: 'failed' } })
      return errorResponse('PAYMENT_ERROR', 'Unable to complete payment. Please try again.', 500)
    }

    const capture = await captureRes.json()
    const succeeded = capture.status === 'COMPLETED'

    await db.donationRecord.updateMany({
      where: { provider_ref: order_id },
      data:  { status: succeeded ? 'succeeded' : 'failed' },
    })

    return successResponse({ status: capture.status }, succeeded ? 'Thank you for your gift!' : 'Payment could not be completed.')
  } catch (error) {
    console.error('[Donations] PayPal capture-order error:', error)
    return serverErrorResponse()
  }
}