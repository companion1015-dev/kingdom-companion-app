import { NextRequest } from 'next/server'
import { withAdmin } from '@/lib/auth/middleware'
import { successResponse, errorResponse, serverErrorResponse } from '@/lib/api-response'
import { prisma } from '@/lib/db/client'

// POST /api/v1/admin/prayer-wall/bulk  body: { ids: string[], action: 'approve' | 'reject', reason?: string }

export const POST = withAdmin(async (req: NextRequest, user) => {
  try {
    const body = await req.json()
    const ids: string[] = Array.isArray(body.ids) ? body.ids : []
    const action = body.action
    const reason = typeof body.reason === 'string' ? body.reason.trim() : null

    if (ids.length === 0) return errorResponse('MISSING_IDS', 'No prayer requests selected.', 400)
    if (!['approve', 'reject'].includes(action)) {
      return errorResponse('INVALID_ACTION', 'Action must be "approve" or "reject".', 400)
    }
    if (action === 'reject' && !reason) {
      return errorResponse('MISSING_REASON', 'Please provide a reason for rejecting these posts.', 400)
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = prisma as any

    const result = await db.prayerRequest.updateMany({
      where: { id: { in: ids } },
      data: {
        moderation_status: action === 'approve' ? 'approved' : 'hidden',
        reviewed_at: new Date(),
        reviewed_by: user.id,
        reviewer_notes: action === 'reject' ? reason : null,
      },
    })

    return successResponse({ updated: result.count }, `${result.count} prayer request(s) ${action === 'approve' ? 'approved' : 'rejected'}.`)
  } catch (error) {
    console.error('[AdminPrayerWall] Bulk action error:', error)
    return serverErrorResponse()
  }
})