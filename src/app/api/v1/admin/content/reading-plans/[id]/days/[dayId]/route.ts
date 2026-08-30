import { NextRequest } from 'next/server'
import { withAdmin } from '@/lib/auth/middleware'
import { successResponse, notFoundResponse, serverErrorResponse } from '@/lib/api-response'
import { prisma } from '@/lib/db/client'

// PATCH/DELETE /api/v1/admin/content/reading-plans/:id/days/:dayId

type ReadingItemInput = { book_id: string; chapter: number; sort_order?: number }

export const PATCH = withAdmin(async (req: NextRequest, _user, context) => {
  try {
    const { id: planId, dayId } = context!.params
    const body = await req.json()
    const { title, description, readings } = body

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = prisma as any
    const existing = await db.readingDay.findFirst({ where: { id: dayId, plan_id: planId } })
    if (!existing) return notFoundResponse('Reading day')

    const data: Record<string, unknown> = {}
    if (title !== undefined)       data.title = title?.trim() || null
    if (description !== undefined) data.description = description?.trim() || null

    const updated = await db.$transaction(async (tx: typeof db) => {
      if (Object.keys(data).length > 0) await tx.readingDay.update({ where: { id: dayId }, data })
      if (Array.isArray(readings)) {
        await tx.readingItem.deleteMany({ where: { day_id: dayId } })
        if (readings.length > 0) {
          await tx.readingItem.createMany({
            data: readings.map((r: ReadingItemInput, i: number) => ({
              day_id: dayId, book_id: r.book_id, chapter: Number(r.chapter), sort_order: r.sort_order ?? i,
            })),
          })
        }
      }
      return tx.readingDay.findUnique({ where: { id: dayId }, include: { readings: { orderBy: { sort_order: 'asc' } } } })
    })

    return successResponse(updated, 'Reading day updated.')
  } catch (error) {
    console.error('[AdminContent] Reading day update error:', error)
    return serverErrorResponse()
  }
})

export const DELETE = withAdmin(async (_req: NextRequest, _user, context) => {
  try {
    const { id: planId, dayId } = context!.params
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = prisma as any
    const existing = await db.readingDay.findFirst({ where: { id: dayId, plan_id: planId } })
    if (!existing) return notFoundResponse('Reading day')
    await db.readingDay.delete({ where: { id: dayId } })
    return successResponse({ deleted: true }, 'Reading day deleted.')
  } catch (error) {
    console.error('[AdminContent] Reading day delete error:', error)
    return serverErrorResponse()
  }
})
