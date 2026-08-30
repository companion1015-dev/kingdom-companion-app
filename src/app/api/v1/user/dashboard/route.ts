import { NextRequest } from 'next/server'
import { withAuth } from '@/lib/auth/middleware'
import { successResponse, serverErrorResponse } from '@/lib/api-response'
import { prisma } from '@/lib/db/client'

// GET /api/v1/user/dashboard
// Genuinely new -- signed-in users had a Profile (settings) page but no
// single place to see their own activity across Prayer Journal, Reading
// Plans, the Prayer Wall, Study tools, and giving. Every query below is
// scoped to the authenticated user's own id, same convention as
// /journal and /reading-plans/progress.

export const GET = withAuth(async (_req: NextRequest, user) => {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = prisma as any

    const [
      prayerJournalTotal, prayerJournalActive, recentJournalPrayers,
      readingProgress,
      myPrayerRequests, savedPrayers,
      noteCount, highlightCount, bookmarkCount,
      totalGivenCents,
    ] = await Promise.all([
      db.prayer.count({ where: { user_id: user.id, deleted_at: null } }),
      db.prayer.count({ where: { user_id: user.id, deleted_at: null, status: 'active' } }),
      db.prayer.findMany({
        where: { user_id: user.id, deleted_at: null }, orderBy: { updated_at: 'desc' }, take: 5,
        select: { id: true, title: true, status: true, updated_at: true },
      }),
      db.readingProgress.findMany({
        where: { user_id: user.id }, orderBy: { updated_at: 'desc' }, take: 5,
        select: {
          reading_plan_id: true, current_day: true, completed: true, paused: true,
          completion_percentage: true, started_at: true, completed_at: true,
          reading_plan: { select: { title: true, duration_days: true } },
        },
      }),
      db.prayerRequest.findMany({
        where: { user_id: user.id, deleted_at: null }, orderBy: { created_at: 'desc' }, take: 5,
        select: { id: true, title: true, category: true, privacy: true, moderation_status: true, prayer_count: true, created_at: true },
      }),
      db.savedPrayer.findMany({
        where: { user_id: user.id }, orderBy: { created_at: 'desc' }, take: 5,
        select: { id: true, created_at: true, request: { select: { id: true, title: true, category: true } } },
      }),
      db.note.count({ where: { user_id: user.id, deleted_at: null } }),
      db.highlight.count({ where: { user_id: user.id } }),
      db.bookmark.count({ where: { user_id: user.id, deleted_at: null } }),
      db.donationRecord.aggregate({ where: { user_id: user.id, status: 'succeeded' }, _sum: { amount_cents: true } }),
    ])

    return successResponse({
      stats: {
        prayer_journal_total: prayerJournalTotal,
        prayer_journal_active: prayerJournalActive,
        reading_plans_in_progress: readingProgress.filter((r: { completed: boolean }) => !r.completed).length,
        reading_plans_completed: readingProgress.filter((r: { completed: boolean }) => r.completed).length,
        prayer_requests_submitted: myPrayerRequests.length,
        saved_prayers: savedPrayers.length,
        study_notes: noteCount,
        study_highlights: highlightCount,
        study_bookmarks: bookmarkCount,
        total_given_cents: totalGivenCents._sum.amount_cents ?? 0,
      },
      recent_journal_prayers: recentJournalPrayers,
      reading_progress: readingProgress,
      my_prayer_requests: myPrayerRequests,
      saved_prayers: savedPrayers,
    }, 'Dashboard data retrieved.')
  } catch (error) {
    console.error('[Dashboard] Get error:', error)
    return serverErrorResponse()
  }
})
