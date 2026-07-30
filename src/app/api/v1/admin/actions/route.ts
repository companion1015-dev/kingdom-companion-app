import { NextRequest } from 'next/server'
import { withAdmin } from '@/lib/auth/middleware'
import { successResponse, errorResponse, serverErrorResponse } from '@/lib/api-response'
import { prisma } from '@/lib/db/client'

// POST /api/v1/admin/actions
// One flexible endpoint for the admin dashboard's moderation actions,
// rather than a separate route per action -- genuinely new capability,
// since reports and feedback previously had no way to be actioned at all.

type Action = 'dismiss_report' | 'hide_prayer' | 'resolve_feedback'

export const POST = withAdmin(async (req: NextRequest) => {
  try {
    const { action, id } = await req.json() as { action: Action; id: string }
    if (!action || !id) return errorResponse('MISSING_FIELDS', 'action and id are required.', 400)

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = prisma as any

    switch (action) {
      case 'dismiss_report':
        await db.prayerReport.update({ where: { id }, data: { status: 'dismissed' } })
        return successResponse(null, 'Report dismissed.')

      case 'hide_prayer':
        // id here is the PrayerRequest id, not the report id -- hides the
        // post and marks every pending report against it as actioned.
        await db.prayerRequest.update({ where: { id }, data: { moderation_status: 'hidden' } })
        await db.prayerReport.updateMany({ where: { request_id: id, status: 'pending' }, data: { status: 'actioned' } })
        return successResponse(null, 'Prayer request hidden.')

      case 'resolve_feedback':
        await db.feedback.update({ where: { id }, data: { status: 'resolved' } })
        return successResponse(null, 'Feedback marked resolved.')

      default:
        return errorResponse('INVALID_ACTION', 'Unknown action.', 400)
    }
  } catch (error) {
    console.error('[Admin] Action error:', error)
    return serverErrorResponse()
  }
})