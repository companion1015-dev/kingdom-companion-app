import { NextRequest } from 'next/server'
import { successResponse, notFoundResponse, serverErrorResponse } from '@/lib/api-response'
import { prisma } from '@/lib/db/client'

// Reading Plan detail — public. Uses the raw UUID `id` as the route
// identifier, not a slug: ReadingPlan has no slug column (unlike Topic,
// DevotionalSeries, BlogArticle, which do). Adding one would be a schema
// change not strictly required to support a working detail route — the
// existing `id` field is sufficient, and this codebase already uses raw
// UUIDs in URLs elsewhere (e.g. /journal/{id}). Not treated as a stop
// condition since the identifier already exists and works.

export async function GET(_req: NextRequest, ctx: { params: { id: string } }) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const plan = await (prisma as any).readingPlan.findUnique({
      where: { id: ctx.params.id },
      include: {
        days: {
          orderBy: { day_number: 'asc' },
          include: { readings: { orderBy: { sort_order: 'asc' } } },
        },
      },
    })

    if (!plan || !plan.is_published) return notFoundResponse('Reading plan')

    return successResponse(plan, 'Reading plan retrieved successfully.')
  } catch {
    return serverErrorResponse()
  }
}
