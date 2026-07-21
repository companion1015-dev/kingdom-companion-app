import { NextRequest } from 'next/server'
import { withAuth } from '@/lib/auth/middleware'
import { successResponse, notFoundResponse, forbiddenResponse, serverErrorResponse } from '@/lib/api-response'
import { prisma } from '@/lib/db/client'

export const PATCH = withAuth(async (req: NextRequest, user, ctx) => {
  try {
    const id   = ctx?.params.id
    const body = await req.json()

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const note = await (prisma as any).note.findUnique({ where: { id } })
    if (!note) return notFoundResponse('Note')
    if (note.user_id !== user.id) return forbiddenResponse()

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updated = await (prisma as any).note.update({
      where: { id },
      data:  {
        ...(body.content !== undefined && { content: body.content }),
        ...(body.tags    !== undefined && { tags:    body.tags    }),
        updated_at: new Date(),
      },
    })
    return successResponse(updated, 'Note updated.')
  } catch {
    return serverErrorResponse()
  }
})

export const DELETE = withAuth(async (_req: NextRequest, user, ctx) => {
  try {
    const id = ctx?.params.id
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const note = await (prisma as any).note.findUnique({ where: { id } })
    if (!note) return notFoundResponse('Note')
    if (note.user_id !== user.id) return forbiddenResponse()

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (prisma as any).note.update({
      where: { id },
      data:  { deleted_at: new Date() },
    })
    return successResponse(null, 'Note deleted.')
  } catch {
    return serverErrorResponse()
  }
})
