import { NextRequest } from 'next/server'
import { withAdmin } from '@/lib/auth/middleware'
import { successResponse, notFoundResponse, serverErrorResponse } from '@/lib/api-response'
import { prisma } from '@/lib/db/client'

// GET/PATCH/DELETE /api/v1/admin/content/reading-plans/:id

export const GET = withAdmin(async (_req: NextRequest, _user, context) => {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const plan = await (prisma as any).readingPlan.findUnique({
      where: { id: context!.params.id },
      include: { days: { orderBy: { day_number: 'asc' }, include: { readings: { orderBy: { sort_order: 'asc' } } } } },
    })
    if (!plan) return notFoundResponse('Reading plan')
    return successResponse(plan, 'Reading plan retrieved.')
  } catch (error) {
    console.error('[AdminContent] Reading plan get error:', error)
    return serverErrorResponse()
  }
})

export const PATCH = withAdmin(async (req: NextRequest, _user, context) => {
  try {
    const id = context!.params.id
    const body = await req.json()
    const { title, description, duration_days, difficulty, is_published } = body

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = prisma as any
    const existing = await db.readingPlan.findUnique({ where: { id } })
    if (!existing) return notFoundResponse('Reading plan')

    const data: Record<string, unknown> = {}
    if (title !== undefined)         data.title = title.trim()
    if (description !== undefined)   data.description = description?.trim() || null
    if (duration_days !== undefined) data.duration_days = Number(duration_days)
    if (difficulty !== undefined)    data.difficulty = difficulty
    if (is_published !== undefined)  data.is_published = !!is_published

    const updated = await db.readingPlan.update({ where: { id }, data })
    return successResponse(updated, 'Reading plan updated.')
  } catch (error) {
    console.error('[AdminContent] Reading plan update error:', error)
    return serverErrorResponse()
  }
})

export const DELETE = withAdmin(async (_req: NextRequest, _user, context) => {
  try {
    const id = context!.params.id
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = prisma as any
    const existing = await db.readingPlan.findUnique({ where: { id } })
    if (!existing) return notFoundResponse('Reading plan')
    await db.readingPlan.delete({ where: { id } })
    return successResponse({ deleted: true }, 'Reading plan deleted.')
  } catch (error) {
    console.error('[AdminContent] Reading plan delete error:', error)
    return serverErrorResponse()
  }
})
