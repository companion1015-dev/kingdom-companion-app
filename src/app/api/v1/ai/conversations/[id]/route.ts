import { NextRequest } from 'next/server'
import { withAuth } from '@/lib/auth/middleware'
import { successResponse, errorResponse, forbiddenResponse, serverErrorResponse } from '@/lib/api-response'
import { prisma } from '@/lib/db/client'

export const GET = withAuth(async (_req: NextRequest, user, context) => {
  const params = context?.params ?? {}
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = prisma as any
    const conversation = await db.aiConversation.findUnique({
      where: { id: params.id },
      include: { messages: { orderBy: { created_at: 'asc' } } },
    })
    if (!conversation) return errorResponse('NOT_FOUND', 'Conversation not found.', 404)
    if (conversation.user_id !== user.id) return forbiddenResponse('This conversation belongs to someone else.')

    return successResponse(conversation, 'Conversation retrieved.')
  } catch (error) {
    console.error('[AI Conversations] Get error:', error)
    return serverErrorResponse()
  }
})

export const PATCH = withAuth(async (req: NextRequest, user, context) => {
  const params = context?.params ?? {}
  try {
    const { title } = await req.json()
    if (!title?.trim()) return errorResponse('MISSING_TITLE', 'Title is required.', 400)

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = prisma as any
    const conversation = await db.aiConversation.findUnique({ where: { id: params.id }, select: { user_id: true } })
    if (!conversation) return errorResponse('NOT_FOUND', 'Conversation not found.', 404)
    if (conversation.user_id !== user.id) return forbiddenResponse('This conversation belongs to someone else.')

    await db.aiConversation.update({ where: { id: params.id }, data: { title: title.trim().slice(0, 255) } })
    return successResponse(null, 'Conversation renamed.')
  } catch (error) {
    console.error('[AI Conversations] Rename error:', error)
    return serverErrorResponse()
  }
})

export const DELETE = withAuth(async (_req: NextRequest, user, context) => {
  const params = context?.params ?? {}
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = prisma as any
    const conversation = await db.aiConversation.findUnique({ where: { id: params.id }, select: { user_id: true } })
    if (!conversation) return errorResponse('NOT_FOUND', 'Conversation not found.', 404)
    if (conversation.user_id !== user.id) return forbiddenResponse('This conversation belongs to someone else.')

    await db.aiConversation.delete({ where: { id: params.id } })
    return successResponse(null, 'Conversation deleted.')
  } catch (error) {
    console.error('[AI Conversations] Delete error:', error)
    return serverErrorResponse()
  }
})