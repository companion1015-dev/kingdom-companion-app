import { NextRequest } from 'next/server'
import { withAuth } from '@/lib/auth/middleware'
import { successResponse, createdResponse, serverErrorResponse } from '@/lib/api-response'
import { prisma } from '@/lib/db/client'

// GET /api/v1/ai/conversations -- list the signed-in user's conversation
// history (most recent first), for the sidebar. Genuinely persisted, not
// mocked -- this is what makes the AI Companion behave like a real chat
// product (ChatGPT, Claude) rather than a single-turn stateless form.
// Guests (no account) don't get server-side history -- their conversation
// lives client-side only for the current session, same local-first pattern
// used elsewhere in this app (Study, Journal) before an account exists.

export const GET = withAuth(async (_req: NextRequest, user) => {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = prisma as any
    const conversations = await db.aiConversation.findMany({
      where: { user_id: user.id },
      orderBy: { updated_at: 'desc' },
      select: {
        id: true, title: true, conversation_type: true,
        created_at: true, updated_at: true,
        _count: { select: { messages: true } },
      },
      take: 100,
    })
    const shaped = conversations.map((c: Record<string, unknown> & { _count: { messages: number } }) => ({
      ...c, message_count: c._count.messages, _count: undefined,
    }))
    return successResponse(shaped, 'Conversations retrieved.')
  } catch (error) {
    console.error('[AI Conversations] List error:', error)
    return serverErrorResponse()
  }
})

export const POST = withAuth(async (req: NextRequest, user) => {
  try {
    const body = await req.json()
    const conversationType = body.conversation_type ?? 'General Questions'

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const conversation = await (prisma as any).aiConversation.create({
      data: { user_id: user.id, conversation_type: conversationType, title: null },
      select: { id: true, title: true, conversation_type: true, created_at: true },
    })
    return createdResponse(conversation, 'Conversation created.')
  } catch (error) {
    console.error('[AI Conversations] Create error:', error)
    return serverErrorResponse()
  }
})