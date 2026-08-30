import { NextRequest } from 'next/server'
import { withAdmin } from '@/lib/auth/middleware'
import { successResponse, notFoundResponse, errorResponse, serverErrorResponse } from '@/lib/api-response'
import { prisma } from '@/lib/db/client'

// GET/PATCH/DELETE /api/v1/admin/content/devotionals/:id

export const GET = withAdmin(async (_req: NextRequest, _user, context) => {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const series = await (prisma as any).devotionalSeries.findUnique({
      where: { id: context!.params.id },
      include: { entries: { orderBy: { day_number: 'asc' } } },
    })
    if (!series) return notFoundResponse('Devotional series')
    return successResponse(series, 'Devotional series retrieved.')
  } catch (error) {
    console.error('[AdminContent] Devotional get error:', error)
    return serverErrorResponse()
  }
})

export const PATCH = withAdmin(async (req: NextRequest, _user, context) => {
  try {
    const id = context!.params.id
    const body = await req.json()
    const { slug, title, category, description, duration_days, is_published } = body

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = prisma as any
    const existing = await db.devotionalSeries.findUnique({ where: { id } })
    if (!existing) return notFoundResponse('Devotional series')

    if (slug && slug.trim() !== existing.slug) {
      const clash = await db.devotionalSeries.findUnique({ where: { slug: slug.trim() } })
      if (clash) return errorResponse('DUPLICATE_SLUG', `A devotional series with slug "${slug}" already exists.`, 409)
    }

    const data: Record<string, unknown> = {}
    if (slug !== undefined)          data.slug = slug.trim()
    if (title !== undefined)         data.title = title.trim()
    if (category !== undefined)      data.category = category.trim()
    if (description !== undefined)   data.description = description?.trim() || null
    if (duration_days !== undefined) data.duration_days = Number(duration_days)
    if (is_published !== undefined)  data.is_published = !!is_published

    const updated = await db.devotionalSeries.update({ where: { id }, data })
    return successResponse(updated, 'Devotional series updated.')
  } catch (error) {
    console.error('[AdminContent] Devotional update error:', error)
    return serverErrorResponse()
  }
})

export const DELETE = withAdmin(async (_req: NextRequest, _user, context) => {
  try {
    const id = context!.params.id
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = prisma as any
    const existing = await db.devotionalSeries.findUnique({ where: { id } })
    if (!existing) return notFoundResponse('Devotional series')
    await db.devotionalSeries.delete({ where: { id } })
    return successResponse({ deleted: true }, 'Devotional series deleted.')
  } catch (error) {
    console.error('[AdminContent] Devotional delete error:', error)
    return serverErrorResponse()
  }
})
