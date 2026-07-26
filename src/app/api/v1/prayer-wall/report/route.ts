import { NextRequest } from 'next/server'
import { withOptionalAuth } from '@/lib/auth/middleware'
import { successResponse, errorResponse, serverErrorResponse } from '@/lib/api-response'
import { checkRateLimit, getRateLimitKey } from '@/lib/auth/rate-limit'
import { prisma } from '@/lib/db/client'

// POST /api/v1/prayer-wall/report
// No auto-hiding on first report -- goes to moderation_status: "pending"
// only once a request accumulates enough reports (see threshold below).
// A single report should not be enough to silence someone's prayer request.

const REPORT_RATE = { limit: 10, windowMs: 60 * 60 * 1000 }
const AUTO_PENDING_THRESHOLD = 3
const VALID_REASONS = ['spam', 'scam', 'offensive', 'misinformation', 'harassment', 'other']

export const POST = withOptionalAuth(async (req: NextRequest, user) => {
  const ip = req.headers.get('x-forwarded-for') ?? 'unknown'
  const { allowed } = checkRateLimit(getRateLimitKey('prayer-report', ip), REPORT_RATE)
  if (!allowed) return errorResponse('RATE_LIMITED', 'Please slow down.', 429)

  try {
    const { request_id, reason, details } = await req.json()
    if (!request_id || !VALID_REASONS.includes(reason)) {
      return errorResponse('INVALID_REPORT', 'A valid request_id and reason are required.', 400)
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = prisma as any
    const request = await db.prayerRequest.findUnique({ where: { id: request_id }, select: { id: true } })
    if (!request) return errorResponse('NOT_FOUND', 'Prayer request not found.', 404)

    await db.prayerReport.create({
      data: { request_id, user_id: user?.id ?? null, reason, details: details?.slice(0, 1000) ?? null },
    })

    const reportCount = await db.prayerReport.count({ where: { request_id, status: 'pending' } })
    if (reportCount >= AUTO_PENDING_THRESHOLD) {
      await db.prayerRequest.update({ where: { id: request_id }, data: { moderation_status: 'pending' } })
    }

    return successResponse(null, 'Report submitted. Thank you for helping keep this space safe.')
  } catch (error) {
    console.error('[PrayerWall] Report error:', error)
    return serverErrorResponse()
  }
})