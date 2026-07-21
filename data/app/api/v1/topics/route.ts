import { NextRequest } from 'next/server'
import { successResponse, serverErrorResponse } from '@/lib/api-response'
import { prisma } from '@/lib/db/client'

// PRD §4.29c — GET /topics. Public, no account required (Constitution §7 —
// Scripture-adjacent content is never gated behind registration).

export async function GET(req: NextRequest) {
  try {
    const category = req.nextUrl.searchParams.get('category')
    const q        = req.nextUrl.searchParams.get('q')

    const where: Record<string, unknown> = { is_published: true }
    if (category) where.category = category
    if (q) where.name = { contains: q, mode: 'insensitive' }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const topics = await (prisma as any).topic.findMany({
      where,
      orderBy: { name: 'asc' },
      select: { id: true, slug: true, name: true, category: true, description: true },
    })

    return successResponse(topics, 'Topics retrieved successfully.')
  } catch {
    return serverErrorResponse()
  }
}
