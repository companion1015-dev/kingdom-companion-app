import { NextRequest } from 'next/server'
import { successResponse, serverErrorResponse } from '@/lib/api-response'
import { prisma } from '@/lib/db/client'

// PRD §4.62 — GET /blog/articles. Public. Only status=published is ever
// returned here — draft/pending_review content has no unauthenticated read
// path, consistent with the editorial workflow already specified.

export async function GET(req: NextRequest) {
  try {
    const category = req.nextUrl.searchParams.get('category')
    const q        = req.nextUrl.searchParams.get('q')

    const where: Record<string, unknown> = { status: 'published' }
    if (category) where.category = { slug: category }
    if (q) where.title = { contains: q, mode: 'insensitive' }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const articles = await (prisma as any).blogArticle.findMany({
      where,
      orderBy: { published_at: 'desc' },
      select: {
        id: true, slug: true, title: true, subtitle: true, featured_image_url: true,
        resource_type: true, estimated_reading_minutes: true, published_at: true,
        author:   { select: { display_name: true, photo_url: true } },
        category: { select: { slug: true, name: true } },
      },
    })

    return successResponse(articles, 'Articles retrieved successfully.')
  } catch {
    return serverErrorResponse()
  }
}
