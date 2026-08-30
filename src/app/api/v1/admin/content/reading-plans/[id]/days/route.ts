import { NextRequest } from 'next/server'
import { withAdmin } from '@/lib/auth/middleware'
import { createdResponse, notFoundResponse, errorResponse, serverErrorResponse } from '@/lib/api-response'
import { prisma } from '@/lib/db/client'

// POST /api/v1/admin/content/reading-plans/:id/days -- add one day to a plan.

type ReadingItemInput = { book_id: string; chapter: number; sort_order?: number }

export const POST = withAdmin(async (req: NextRequest, _user, context) => {
  try {
    const planId = context!.params.id
    const body = await req.json()
    const { day_number, title, description, readings } = body

    if (!day_number || !Array.isArray(readings) || readings.length === 0) {
      return errorResponse('MISSING_FIELDS', 'day_number and at least one reading (book_id + chapter) are required.', 400)
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = prisma as any
    const plan = await db.readingPlan.findUnique({ where: { id: planId } })
    if (!plan) return notFoundResponse('Reading plan')

    const clash = await db.readingDay.findUnique({
      where: { plan_id_day_number: { plan_id: planId, day_number: Number(day_number) } },
    })
    if (clash) return errorResponse('DUPLICATE_DAY', `Day ${day_number} already exists for this plan.`, 409)

    const day = await db.readingDay.create({
      data: {
        plan_id: planId, day_number: Number(day_number), title: title?.trim() || null,
        description: description?.trim() || null,
        readings: {
          create: readings.map((r: ReadingItemInput, i: number) => ({
            book_id: r.book_id, chapter: Number(r.chapter), sort_order: r.sort_order ?? i,
          })),
        },
      },
      include: { readings: { orderBy: { sort_order: 'asc' } } },
    })

    return createdResponse(day, 'Reading day created.')
  } catch (error) {
    console.error('[AdminContent] Reading day create error:', error)
    return serverErrorResponse()
  }
})
