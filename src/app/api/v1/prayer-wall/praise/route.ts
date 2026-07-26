import { NextRequest } from 'next/server'
import { successResponse, serverErrorResponse } from '@/lib/api-response'
import { prisma } from '@/lib/db/client'

// GET /api/v1/prayer-wall/praise?category=
// Public. Only ever returns is_public: true testimonies -- a submitter who
// chose is_public: false when marking their prayer answered keeps that
// testimony private, visible only to them via their own request history.

export async function GET(req: NextRequest) {
  try {
    const category = req.nextUrl.searchParams.get('category')

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = prisma as any
    const where: Record<string, unknown> = { is_public: true }
    if (category) where.praise_category = category

    const praise = await db.prayerAnswered.findMany({
      where, orderBy: { created_at: 'desc' }, take: 50,
      include: { request: { select: { title: true } } },
    })

    const shaped = praise.map((p: Record<string, unknown> & { request: { title: string } }) => ({
      ...p, request_title: p.request.title, request: undefined,
    }))

    return successResponse(shaped, 'Praise reports retrieved.')
  } catch (error) {
    console.error('[PrayerWall] Praise error:', error)
    return serverErrorResponse()
  }
}