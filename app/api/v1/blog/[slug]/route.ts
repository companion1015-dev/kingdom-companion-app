import { NextRequest } from 'next/server'
import { successResponse, notFoundResponse, serverErrorResponse } from '@/lib/api-response'
import { prisma } from '@/lib/db/client'

// PRD §4.62 — GET /blog/articles/{slug}. Public. Unpublished articles are
// never returned to an unauthenticated reader, regardless of slug guessing.

export async function GET(_req: NextRequest, ctx: { params: { slug: string } }) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const article = await (prisma as any).blogArticle.findUnique({
      where: { slug: ctx.params.slug },
      include: {
        author:   { select: { display_name: true, bio: true, photo_url: true } },
        category: { select: { slug: true, name: true } },
      },
    })

    if (!article || article.status !== 'published') return notFoundResponse('Article')

    return successResponse(article, 'Article retrieved successfully.')
  } catch {
    return serverErrorResponse()
  }
}
