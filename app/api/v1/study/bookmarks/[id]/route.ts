import { NextRequest } from 'next/server'
import { withAuth } from '@/lib/auth/middleware'
import { successResponse, notFoundResponse, forbiddenResponse, serverErrorResponse } from '@/lib/api-response'
import { prisma } from '@/lib/db/client'

export const DELETE = withAuth(async (_req: NextRequest, user, ctx) => {
  try {
    const id = ctx?.params.id
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const bookmark = await (prisma as any).bookmark.findUnique({ where: { id } })
    if (!bookmark) return notFoundResponse('Bookmark')
    if (bookmark.user_id !== user.id) return forbiddenResponse()

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (prisma as any).bookmark.update({
      where: { id },
      data:  { deleted_at: new Date() },
    })
    return successResponse(null, 'Bookmark removed.')
  } catch {
    return serverErrorResponse()
  }
})
