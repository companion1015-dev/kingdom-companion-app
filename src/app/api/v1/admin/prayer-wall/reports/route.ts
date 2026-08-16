import { NextRequest } from 'next/server'
import { withAdmin } from '@/lib/auth/middleware'
import { successResponse, errorResponse, serverErrorResponse } from '@/lib/api-response'
import { prisma } from '@/lib/db/client'

// GET /api/v1/admin/prayer-wall/reports?status=pending|reviewed|actioned|dismissed
// PATCH body: { id: string, action: 'dismiss' | 'remove_post', admin_notes?: string }

export const GET = withAdmin(async (req: NextRequest) => {
  try {
    const status = req.nextUrl.searchParams.get('status') ?? 'pending'
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = prisma as any

    const where: Record<string, unknown> = {}
    if (['pending', 'reviewed', 'actioned', 'dismissed'].includes(status)) where.status = status

    const [items, openCount] = await Promise.all([
      db.prayerReport.findMany({
        where, orderBy: { created_at: 'desc' }, take: 100,
        select: {
          id: true, reason: true, details: true, status: true, created_at: true,
          user: { select: { email: true } },
          request: { select: { id: true, title: true, content: true, moderation_status: true } },
        },
      }),
      db.prayerReport.count({ where: { status: 'pending' } }),
    ])

    return successResponse({ items, openCount }, 'Reports retrieved.')
  } catch (error) {
    console.error('[AdminPrayerWall] Reports GET error:', error)
    return serverErrorResponse()
  }
})

export const PATCH = withAdmin(async (req: NextRequest, user) => {
  try {
    const body = await req.json()
    const { id, action, admin_notes } = body
    if (!id || !['dismiss', 'remove_post'].includes(action)) {
      return errorResponse('INVALID_ACTION', 'A valid report id and action are required.', 400)
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = prisma as any
    const report = await db.prayerReport.findUnique({ where: { id }, select: { request_id: true } })
    if (!report) return errorResponse('NOT_FOUND', 'Report not found.', 404)

    if (action === 'remove_post') {
      await db.prayerRequest.update({
        where: { id: report.request_id },
        data: { moderation_status: 'hidden', reviewed_at: new Date(), reviewed_by: user.id, reviewer_notes: admin_notes ?? 'Removed following a Prayer Wall report.' },
      })
    }

    await db.prayerReport.update({
      where: { id },
      data: { status: action === 'remove_post' ? 'actioned' : 'dismissed' },
    })

    return successResponse({ id }, action === 'remove_post' ? 'Post removed and report actioned.' : 'Report dismissed.')
  } catch (error) {
    console.error('[AdminPrayerWall] Reports PATCH error:', error)
    return serverErrorResponse()
  }
})