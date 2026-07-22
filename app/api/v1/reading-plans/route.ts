import { NextRequest } from 'next/server'
import { successResponse, serverErrorResponse } from '@/lib/api-response'
import { prisma } from '@/lib/db/client'

// Reading Plans — public index. Follows the same convention already
// established by /api/v1/topics and /api/v1/devotionals: no auth required,
// (prisma as any) cast, select projection matching only fields that
// genuinely exist on ReadingPlan. Progress tracking is intentionally NOT
// implemented here — see the engineering report for why.

export async function GET(req: NextRequest) {
  try {
    const difficulty = req.nextUrl.searchParams.get('difficulty')
    const where: Record<string, unknown> = { is_published: true }
    if (difficulty) where.difficulty = difficulty

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const plans = await (prisma as any).readingPlan.findMany({
      where,
      orderBy: { created_at: 'desc' },
      select: {
        id: true, title: true, description: true,
        duration_days: true, difficulty: true,
      },
    })

    return successResponse(plans, 'Reading plans retrieved successfully.')
  } catch {
    return serverErrorResponse()
  }
}
