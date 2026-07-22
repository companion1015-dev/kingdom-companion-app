import { NextRequest } from 'next/server'
import { withAuth } from '@/lib/auth/middleware'
import { successResponse, notFoundResponse, forbiddenResponse, serverErrorResponse } from '@/lib/api-response'
import { prisma } from '@/lib/db/client'

type Ctx = { params: { id: string } }

// PATCH /api/v1/study/highlights/[id] — update colour
export const PATCH = withAuth(async (req: NextRequest, user, ctx) => {
  try {
    const id    = ctx?.params.id
    const body  = await req.json()
    const color = body.color

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const highlight = await (prisma as any).highlight.findUnique({ where: { id } })
    if (!highlight) return notFoundResponse('Highlight')
    if (highlight.user_id !== user.id) return forbiddenResponse()

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updated = await (prisma as any).highlight.update({
      where: { id },
      data:  { color, updated_at: new Date() },
    })
    return successResponse(updated, 'Highlight updated.')
  } catch {
    return serverErrorResponse()
  }
})

// DELETE /api/v1/study/highlights/[id] — soft delete
export const DELETE = withAuth(async (_req: NextRequest, user, ctx) => {
  try {
    const id = ctx?.params.id
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const highlight = await (prisma as any).highlight.findUnique({ where: { id } })
    if (!highlight) return notFoundResponse('Highlight')
    if (highlight.user_id !== user.id) return forbiddenResponse()

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (prisma as any).highlight.update({
      where: { id },
      data:  { deleted_at: new Date() },
    })
    return successResponse(null, 'Highlight removed.')
  } catch {
    return serverErrorResponse()
  }
})
