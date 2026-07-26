import { NextRequest } from 'next/server'
import { withOptionalAuth } from '@/lib/auth/middleware'
import { successResponse, serverErrorResponse } from '@/lib/api-response'
import { prisma } from '@/lib/db/client'

// GET /api/v1/prayer-wall/feed?category=&sort=&page=&limit=
// Public feed. Only ever returns privacy: community | public requests --
// "private" entries never appear here, matching the privacy tiers set out
// in the Prayer Wall spec. moderation_status must be "approved".

export const GET = withOptionalAuth(async (req: NextRequest, user) => {
  try {
    const category = req.nextUrl.searchParams.get('category')
    const sort     = req.nextUrl.searchParams.get('sort') ?? 'recent'
    const page     = Math.max(1, parseInt(req.nextUrl.searchParams.get('page') ?? '1'))
    const limit    = Math.min(50, Math.max(1, parseInt(req.nextUrl.searchParams.get('limit') ?? '10')))

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = prisma as any

    const where: Record<string, unknown> = {
      privacy:           { in: ['community', 'public'] },
      moderation_status: 'approved',
      status:            { not: 'removed' },
      deleted_at:        null,
    }
    if (category && category !== 'all') where.category = category

    const orderBy =
      sort === 'most_prayed' ? { prayer_count: 'desc' } :
      sort === 'answered'    ? { answered_at: 'desc' }  :
      { created_at: 'desc' }

    const [requests, total] = await Promise.all([
      db.prayerRequest.findMany({
        where, orderBy,
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true, title: true, content: true, category: true, privacy: true,
          display_name: true, country_code: true, status: true, prayer_count: true,
          is_featured: true, created_at: true, answered_at: true,
          attachment_url: true, attachment_type: true,
          _count: { select: { reactions: true } },
        },
      }),
      db.prayerRequest.count({ where }),
    ])

    // Per-user "has_prayed" / "has_saved" flags -- only computed when signed in.
    let prayedSet = new Set<string>()
    let savedSet  = new Set<string>()
    if (user) {
      const ids = requests.map((r: { id: string }) => r.id)
      const [prayed, saved] = await Promise.all([
        db.prayerReaction.findMany({ where: { user_id: user.id, request_id: { in: ids }, type: 'prayed' }, select: { request_id: true } }),
        db.savedPrayer.findMany({ where: { user_id: user.id, request_id: { in: ids } }, select: { request_id: true } }),
      ])
      prayedSet = new Set(prayed.map((p: { request_id: string }) => p.request_id))
      savedSet  = new Set(saved.map((s: { request_id: string }) => s.request_id))
    }

    const shaped = requests.map((r: Record<string, unknown> & { id: string; _count: { reactions: number } }) => ({
      ...r,
      encouragement_count: r._count.reactions,
      has_prayed: prayedSet.has(r.id),
      has_saved:  savedSet.has(r.id),
      _count: undefined,
    }))

    return successResponse(
      { requests: shaped, total, page, hasMore: page * limit < total },
      'Prayer feed retrieved successfully.'
    )
  } catch (error) {
    console.error('[PrayerWall] Feed error:', error)
    return serverErrorResponse()
  }
})