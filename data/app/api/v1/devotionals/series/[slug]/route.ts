import { NextRequest } from 'next/server'
import { successResponse, notFoundResponse, serverErrorResponse } from '@/lib/api-response'
import { prisma } from '@/lib/db/client'

// PRD §4.44 — GET /devotionals/series/{slug}. Public.

export async function GET(_req: NextRequest, ctx: { params: { slug: string } }) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const series = await (prisma as any).devotionalSeries.findUnique({
      where: { slug: ctx.params.slug },
      include: { entries: { orderBy: { day_number: 'asc' } } },
    })

    if (!series || !series.is_published) return notFoundResponse('Devotional series')

    return successResponse(series, 'Devotional series retrieved successfully.')
  } catch {
    return serverErrorResponse()
  }
}
