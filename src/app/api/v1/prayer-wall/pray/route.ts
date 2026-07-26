import { NextRequest } from 'next/server'
import { withOptionalAuth } from '@/lib/auth/middleware'
import { successResponse, errorResponse, serverErrorResponse } from '@/lib/api-response'
import { checkRateLimit, getRateLimitKey } from '@/lib/auth/rate-limit'
import { prisma } from '@/lib/db/client'

// POST /api/v1/prayer-wall/pray
// "I Prayed" -- the Prayer Wall's replacement for a generic Like, per spec.
// Anonymous users may pray too; only signed-in users get true one-time-only
// enforcement (an anonymous visitor can only be rate-limited by IP, not
// reliably deduplicated -- an accepted, documented limitation rather than
// a false promise of perfect anonymous dedup).

const PRAY_RATE = { limit: 30, windowMs: 60 * 60 * 1000 }

export const POST = withOptionalAuth(async (req: NextRequest, user) => {
  const ip = req.headers.get('x-forwarded-for') ?? 'unknown'
  const { allowed } = checkRateLimit(getRateLimitKey('prayer-pray', ip), PRAY_RATE)
  if (!allowed) return errorResponse('RATE_LIMITED', 'Please slow down.', 429)

  try {
    const { request_id } = await req.json()
    if (!request_id) return errorResponse('MISSING_ID', 'request_id is required.', 400)

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = prisma as any

    const request = await db.prayerRequest.findUnique({ where: { id: request_id }, select: { id: true, status: true } })
    if (!request) return errorResponse('NOT_FOUND', 'Prayer request not found.', 404)

    if (user) {
      const existing = await db.prayerReaction.findFirst({
        where: { request_id, user_id: user.id, type: 'prayed' },
      })
      if (existing) return successResponse({ already_prayed: true }, 'You already prayed for this.')
    }

    await db.prayerReaction.create({
      data: { request_id, user_id: user?.id ?? null, type: 'prayed' },
    })
    const updated = await db.prayerRequest.update({
      where: { id: request_id },
      data:  { prayer_count: { increment: 1 } },
      select: { prayer_count: true },
    })

    return successResponse({ prayer_count: updated.prayer_count }, 'Thank you for praying. 🙏')
  } catch (error) {
    console.error('[PrayerWall] Pray error:', error)
    return serverErrorResponse()
  }
})