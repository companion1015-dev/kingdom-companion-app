import { NextRequest } from 'next/server'
import { withAuth } from '@/lib/auth/middleware'
import { successResponse, errorResponse, serverErrorResponse } from '@/lib/api-response'
import { prisma } from '@/lib/db/client'

// POST /api/v1/prayer-wall/saved
// Requires a real account -- unlike praying/encouraging, saving needs a
// durable user_id to mean anything, so this one route does require auth
// (the frontend already treats this as sign-in-gated).
// Toggles: if already saved, un-saves it; otherwise saves it.

export const POST = withAuth(async (req: NextRequest, user) => {
  try {
    const { request_id } = await req.json()
    if (!request_id) return errorResponse('MISSING_ID', 'request_id is required.', 400)

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = prisma as any
    const existing = await db.savedPrayer.findUnique({
      where: { user_id_request_id: { user_id: user.id, request_id } },
    })

    if (existing) {
      await db.savedPrayer.delete({ where: { id: existing.id } })
      return successResponse({ saved: false }, 'Removed from saved.')
    }

    await db.savedPrayer.create({ data: { user_id: user.id, request_id } })
    return successResponse({ saved: true }, 'Saved for prayer.')
  } catch (error) {
    console.error('[PrayerWall] Saved error:', error)
    return serverErrorResponse()
  }
})