import { NextRequest } from 'next/server'
import { successResponse, notFoundResponse, serverErrorResponse } from '@/lib/api-response'
import { prisma } from '@/lib/db/client'

// PRD §4.29c — GET /topics/{slug}. Public.

export async function GET(_req: NextRequest, ctx: { params: { slug: string } }) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const topic = await (prisma as any).topic.findUnique({
      where: { slug: ctx.params.slug },
      include: { verses: { orderBy: { display_order: 'asc' } } },
    })

    if (!topic || !topic.is_published) return notFoundResponse('Topic')

    return successResponse(topic, 'Topic retrieved successfully.')
  } catch {
    return serverErrorResponse()
  }
}
