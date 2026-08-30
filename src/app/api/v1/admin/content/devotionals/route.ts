import { NextRequest } from 'next/server'
import { withAdmin } from '@/lib/auth/middleware'
import { successResponse, createdResponse, errorResponse, serverErrorResponse } from '@/lib/api-response'
import { prisma } from '@/lib/db/client'

// GET/POST /api/v1/admin/content/devotionals
// Admin CMS for the Devotional Library (public reader: /api/v1/devotionals).
// Entries (individual days) are managed separately via the nested
// /devotionals/:id/entries routes -- a series is created here with its
// metadata only, then built out day by day.

export const GET = withAdmin(async () => {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const series = await (prisma as any).devotionalSeries.findMany({
      orderBy: { created_at: 'desc' },
      include: { _count: { select: { entries: true } } },
    })
    return successResponse(series, 'Devotional series retrieved.')
  } catch (error) {
    console.error('[AdminContent] Devotionals list error:', error)
    return serverErrorResponse()
  }
})

export const POST = withAdmin(async (req: NextRequest) => {
  try {
    const body = await req.json()
    const { slug, title, category, description, duration_days, is_published } = body

    if (!slug?.trim() || !title?.trim() || !category?.trim() || !duration_days) {
      return errorResponse('MISSING_FIELDS', 'slug, title, category and duration_days are required.', 400)
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = prisma as any
    const existing = await db.devotionalSeries.findUnique({ where: { slug: slug.trim() } })
    if (existing) return errorResponse('DUPLICATE_SLUG', `A devotional series with slug "${slug}" already exists.`, 409)

    const created = await db.devotionalSeries.create({
      data: {
        slug: slug.trim(), title: title.trim(), category: category.trim(),
        description: description?.trim() || null, duration_days: Number(duration_days),
        is_published: is_published ?? true,
      },
    })

    return createdResponse(created, 'Devotional series created.')
  } catch (error) {
    console.error('[AdminContent] Devotional create error:', error)
    return serverErrorResponse()
  }
})
