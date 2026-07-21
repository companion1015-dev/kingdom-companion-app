import { NextRequest } from 'next/server'
import { successResponse, serverErrorResponse } from '@/lib/api-response'
import { prisma } from '@/lib/db/client'

// PRD §4.44 — GET /devotionals/series. Public. Distinct from /api/v1/daily
// (Daily Encouragement, already implemented separately) — this is the
// named, multi-day Devotional Library.

export async function GET(req: NextRequest) {
  try {
    const category = req.nextUrl.searchParams.get('category')
    const where: Record<string, unknown> = { is_published: true }
    if (category) where.category = category

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const series = await (prisma as any).devotionalSeries.findMany({
      where,
      orderBy: { title: 'asc' },
      select: {
        id: true, slug: true, title: true, category: true,
        description: true, duration_days: true,
      },
    })

    return successResponse(series, 'Devotional series retrieved successfully.')
  } catch {
    return serverErrorResponse()
  }
}
