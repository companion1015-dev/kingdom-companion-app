import { NextRequest } from 'next/server'
import { withOptionalAuth } from '@/lib/auth/middleware'
import { successResponse, errorResponse, serverErrorResponse } from '@/lib/api-response'
import { checkRateLimit, getRateLimitKey } from '@/lib/auth/rate-limit'
import { prisma } from '@/lib/db/client'

// POST /api/v1/prayer-wall/encourage
// Handles both "encouragement" (free text) and "verse" (Scripture share)
// reaction types -- same underlying model, distinguished by `type`.

const ENCOURAGE_RATE = { limit: 20, windowMs: 60 * 60 * 1000 }

export const POST = withOptionalAuth(async (req: NextRequest, user) => {
  const ip = req.headers.get('x-forwarded-for') ?? 'unknown'
  const { allowed } = checkRateLimit(getRateLimitKey('prayer-encourage', ip), ENCOURAGE_RATE)
  if (!allowed) return errorResponse('RATE_LIMITED', 'Please slow down.', 429)

  try {
    const { request_id, type, content } = await req.json()
    if (!request_id || !content?.trim()) {
      return errorResponse('MISSING_FIELDS', 'request_id and content are required.', 400)
    }
    if (!['encouragement', 'verse'].includes(type)) {
      return errorResponse('INVALID_TYPE', 'type must be encouragement or verse.', 400)
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = prisma as any
    const request = await db.prayerRequest.findUnique({ where: { id: request_id }, select: { id: true } })
    if (!request) return errorResponse('NOT_FOUND', 'Prayer request not found.', 404)

    await db.prayerReaction.create({
      data: { request_id, user_id: user?.id ?? null, type, content: content.trim().slice(0, 500) },
    })

    return successResponse(null, type === 'verse' ? 'Verse shared.' : 'Encouragement sent.')
  } catch (error) {
    console.error('[PrayerWall] Encourage error:', error)
    return serverErrorResponse()
  }
})