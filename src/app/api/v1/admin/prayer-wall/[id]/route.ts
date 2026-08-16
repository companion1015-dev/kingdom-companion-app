import { NextRequest } from 'next/server'
import { withAdmin } from '@/lib/auth/middleware'
import { successResponse, errorResponse, serverErrorResponse } from '@/lib/api-response'
import { prisma } from '@/lib/db/client'

// PATCH /api/v1/admin/prayer-wall/[id]  body: { action: 'approve' | 'reject', reason?: string }
// DELETE /api/v1/admin/prayer-wall/[id]  -- soft delete (sets deleted_at), used for
// removing already-approved posts, per the spec's "Delete" safety feature.

export const PATCH = withAdmin(async (req: NextRequest, user, context) => {
  try {
    const id = context?.params?.id
    if (!id) return errorResponse('MISSING_ID', 'Missing prayer request id.', 400)

    const body = await req.json()
    const action = body.action
    const reason = typeof body.reason === 'string' ? body.reason.trim() : null

    if (!['approve', 'reject'].includes(action)) {
      return errorResponse('INVALID_ACTION', 'Action must be "approve" or "reject".', 400)
    }
    if (action === 'reject' && !reason) {
      return errorResponse('MISSING_REASON', 'Please provide a reason for rejecting this post.', 400)
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = prisma as any

    const updated = await db.prayerRequest.update({
      where: { id },
      data: {
        moderation_status: action === 'approve' ? 'approved' : 'hidden',
        reviewed_at: new Date(),
        reviewed_by: user.id,
        reviewer_notes: action === 'reject' ? reason : null,
      },
      select: { id: true, moderation_status: true },
    })

    return successResponse(updated, `Prayer request ${action === 'approve' ? 'approved' : 'rejected'}.`)
  } catch (error) {
    console.error('[AdminPrayerWall] Action error:', error)
    return serverErrorResponse()
  }
})

export const DELETE = withAdmin(async (_req: NextRequest, user, context) => {
  try {
    const id = context?.params?.id
    if (!id) return errorResponse('MISSING_ID', 'Missing prayer request id.', 400)

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = prisma as any
    await db.prayerRequest.update({
      where: { id },
      data: { deleted_at: new Date(), reviewed_by: user.id, reviewed_at: new Date() },
    })

    return successResponse({ id }, 'Prayer request deleted.')
  } catch (error) {
    console.error('[AdminPrayerWall] Delete error:', error)
    return serverErrorResponse()
  }
})