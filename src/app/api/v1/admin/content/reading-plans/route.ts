import { NextRequest } from 'next/server'
import { withAdmin } from '@/lib/auth/middleware'
import { successResponse, createdResponse, errorResponse, serverErrorResponse } from '@/lib/api-response'
import { prisma } from '@/lib/db/client'

// GET/POST /api/v1/admin/content/reading-plans
// Admin CMS for Reading Plans (public reader: /api/v1/reading-plans).
// Previously the only way to create a plan was the one-off
// /admin/seed-reading-plan script, which seeds a single hardcoded
// full-Bible plan. This lets admins create any plan; days are added
// separately via the nested /reading-plans/:id/days routes.

export const GET = withAdmin(async () => {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const plans = await (prisma as any).readingPlan.findMany({
      orderBy: { created_at: 'desc' },
      include: { _count: { select: { days: true } } },
    })
    return successResponse(plans, 'Reading plans retrieved.')
  } catch (error) {
    console.error('[AdminContent] Reading plans list error:', error)
    return serverErrorResponse()
  }
})

export const POST = withAdmin(async (req: NextRequest) => {
  try {
    const body = await req.json()
    const { title, description, duration_days, difficulty, is_published } = body

    if (!title?.trim() || !duration_days) {
      return errorResponse('MISSING_FIELDS', 'title and duration_days are required.', 400)
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = prisma as any
    const created = await db.readingPlan.create({
      data: {
        title: title.trim(), description: description?.trim() || null,
        duration_days: Number(duration_days), difficulty: difficulty || 'beginner',
        is_published: is_published ?? false,
      },
    })

    return createdResponse(created, 'Reading plan created.')
  } catch (error) {
    console.error('[AdminContent] Reading plan create error:', error)
    return serverErrorResponse()
  }
})
