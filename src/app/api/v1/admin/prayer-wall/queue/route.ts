import { NextRequest } from 'next/server'
import { withAdmin } from '@/lib/auth/middleware'
import { successResponse, serverErrorResponse } from '@/lib/api-response'
import { prisma } from '@/lib/db/client'
import { findBlockedContent } from '@/modules/prayer-wall/utils/content-safety'

// GET /api/v1/admin/prayer-wall/queue?status=pending|approved|hidden&search=&page=&limit=
// Pre-publish moderation queue. "hidden" is used as the reject state, reusing
// the existing moderation_status enum (approved | pending | hidden) rather
// than adding a fourth status value.

export const GET = withAdmin(async (req: NextRequest) => {
  try {
    const status = req.nextUrl.searchParams.get('status') ?? 'pending'
    const search = req.nextUrl.searchParams.get('search') ?? ''
    const page   = Math.max(1, parseInt(req.nextUrl.searchParams.get('page') ?? '1'))
    const limit  = Math.min(100, Math.max(1, parseInt(req.nextUrl.searchParams.get('limit') ?? '25')))

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = prisma as any

    const where: Record<string, unknown> = { deleted_at: null }
    if (['pending', 'approved', 'hidden'].includes(status)) where.moderation_status = status
    if (search.trim()) {
      where.OR = [
        { title:   { contains: search, mode: 'insensitive' } },
        { content: { contains: search, mode: 'insensitive' } },
      ]
    }

    const [items, total, counts] = await Promise.all([
      db.prayerRequest.findMany({
        where, orderBy: { created_at: 'desc' },
        skip: (page - 1) * limit, take: limit,
        select: {
          id: true, title: true, content: true, category: true, privacy: true,
          display_name: true, moderation_status: true, created_at: true,
          reviewed_at: true, reviewer_notes: true, reviewed_by: true,
          user: { select: { email: true } },
        },
      }),
      db.prayerRequest.count({ where }),
      Promise.all([
        db.prayerRequest.count({ where: { moderation_status: 'pending', deleted_at: null } }),
        db.prayerRequest.count({ where: { moderation_status: 'approved', deleted_at: null } }),
        db.prayerRequest.count({ where: { moderation_status: 'hidden', deleted_at: null } }),
      ]),
    ])

    const shaped = items.map((r: Record<string, unknown> & { content: string; title: string }) => ({
      ...r,
      flagged: findBlockedContent(`${r.title} ${r.content}`).map(f => f.name),
    }))

    return successResponse(
      {
        items: shaped, total, page, hasMore: page * limit < total,
        counts: { pending: counts[0], approved: counts[1], rejected: counts[2] },
      },
      'Moderation queue retrieved.'
    )
  } catch (error) {
    console.error('[AdminPrayerWall] Queue error:', error)
    return serverErrorResponse()
  }
})