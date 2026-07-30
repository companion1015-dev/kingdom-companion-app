import { NextRequest } from 'next/server'
import { withAdmin } from '@/lib/auth/middleware'
import { successResponse, serverErrorResponse } from '@/lib/api-response'
import { prisma } from '@/lib/db/client'

// GET /api/v1/admin/dashboard
// Genuinely new -- no admin dashboard existed anywhere before this,
// despite real moderation queues, feedback messages, and donation records
// already accumulating in the database with no way to actually see them.

export const GET = withAdmin(async (_req: NextRequest) => {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = prisma as any

    const [
      userCount, pendingReports, openFeedback, recentDonations,
      totalDonatedCents, prayerRequestCount, reports, feedback,
    ] = await Promise.all([
      db.user.count(),
      db.prayerReport.count({ where: { status: 'pending' } }),
      db.feedback.count({ where: { status: 'open' } }),
      db.donationRecord.findMany({
        where: { status: 'succeeded' }, orderBy: { created_at: 'desc' }, take: 10,
        select: { id: true, amount_cents: true, currency: true, frequency: true, donor_display_name: true, is_anonymous: true, created_at: true, payment_provider: true },
      }),
      db.donationRecord.aggregate({ where: { status: 'succeeded' }, _sum: { amount_cents: true } }),
      db.prayerRequest.count({ where: { deleted_at: null } }),
      db.prayerReport.findMany({
        where: { status: 'pending' }, orderBy: { created_at: 'desc' }, take: 20,
        include: { request: { select: { id: true, title: true, content: true, category: true } } },
      }),
      db.feedback.findMany({
        where: { status: 'open' }, orderBy: { created_at: 'desc' }, take: 20,
        select: { id: true, feedback_type: true, subject: true, message: true, created_at: true },
      }),
    ])

    return successResponse({
      stats: {
        total_users: userCount,
        pending_reports: pendingReports,
        open_feedback: openFeedback,
        total_prayer_requests: prayerRequestCount,
        total_donated_cents: totalDonatedCents._sum.amount_cents ?? 0,
      },
      recent_donations: recentDonations,
      prayer_reports: reports.map((r: Record<string, unknown> & { request: unknown }) => ({ ...r, request: r.request })),
      feedback,
    }, 'Admin dashboard data retrieved.')
  } catch (error) {
    console.error('[Admin] Dashboard error:', error)
    return serverErrorResponse()
  }
})