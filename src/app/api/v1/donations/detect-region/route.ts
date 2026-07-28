import { NextRequest } from 'next/server'
import { successResponse } from '@/lib/api-response'
import { COUNTRY_CURRENCY } from '@/modules/donations/types'

// GET /api/v1/donations/detect-region
// Uses Vercel's free, built-in x-vercel-ip-country header -- no external
// geolocation service, no fabricated capability. Documented caveat: this
// header's availability has varied by Vercel plan tier historically: if
// it's absent (e.g. running locally, or a plan tier that doesn't include
// it), this honestly returns country: null rather than guessing, and the
// frontend falls back to browser locale on its own.

export async function GET(req: NextRequest) {
  const country = req.headers.get('x-vercel-ip-country')
  const currency = country ? (COUNTRY_CURRENCY[country] ?? 'USD') : null

  return successResponse({ country, currency }, 'Region detected.')
}
