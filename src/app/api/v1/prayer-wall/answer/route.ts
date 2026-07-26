import { NextRequest } from 'next/server'
import { withAuth } from '@/lib/auth/middleware'
import { successResponse, errorResponse, forbiddenResponse, serverErrorResponse } from '@/lib/api-response'
import { prisma } from '@/lib/db/client'

// POST /api/v1/prayer-wall/answer
// Only the original submitter may mark their own request answered.
// Requires auth -- an anonymously-submitted request (user_id: null) can
// never be marked answered through this route, since there is no owner to
// verify against. That's an accepted limitation of allowing anonymous
// submission in the first place, not an oversight.

export const POST = withAuth(async (req: NextRequest, user) => {
  try {
    const { request_id, testimony, bible_verse, thanksgiving, praise_category, is_public } = await req.json()
    if (!request_id || !testimony?.trim() || !praise_category) {
      return errorResponse('MISSING_FIELDS', 'request_id, testimony, and praise_category are required.', 400)
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = prisma as any
    const request = await db.prayerRequest.findUnique({ where: { id: request_id }, select: { id: true, user_id: true } })
    if (!request) return errorResponse('NOT_FOUND', 'Prayer request not found.', 404)
    if (request.user_id !== user.id) return forbiddenResponse('Only the original submitter can mark this answered.')

    await db.prayerAnswered.create({
      data: {
        request_id, testimony: testimony.trim(),
        bible_verse:  bible_verse?.trim() || null,
        thanksgiving: thanksgiving?.trim() || null,
        praise_category,
        is_public: is_public !== false,
      },
    })
    await db.prayerRequest.update({
      where: { id: request_id },
      data:  { status: 'answered', answered_at: new Date() },
    })

    return successResponse(null, 'Praise God! Marked as answered.')
  } catch (error) {
    console.error('[PrayerWall] Answer error:', error)
    return serverErrorResponse()
  }
})