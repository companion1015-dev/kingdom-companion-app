import { NextRequest } from 'next/server'
import { z } from 'zod'
import { withAuth } from '@/lib/auth/middleware'
import { forbiddenResponse, notFoundResponse, successResponse, validationErrorResponse, serverErrorResponse } from '@/lib/api-response'
import { prisma } from '@/lib/db/client'
import { roomService, isModeratorRole } from '@/lib/prayer-live/livekit'

const ModerateSchema = z.object({
  identity: z.string().min(1),
  muted: z.boolean(),
})

/**
 * POST /api/v1/prayer-live/rooms/:roomName/moderate
 * Moderator-only. Revokes/restores a participant's canPublishData (chat)
 * permission in real time via LiveKit -- lightweight moderation. No message
 * history exists to delete since LiveKit's built-in Chat is peer-to-peer
 * and never persisted.
 */
export const POST = withAuth(async (req: NextRequest, user, context) => {
  const roomName = context?.params.roomName
  if (!roomName) return notFoundResponse('Prayer room')

  if (!isModeratorRole(user.role)) {
    return forbiddenResponse('Only a moderator can manage chat.')
  }

  try {
    const room = await prisma.prayerLiveRoom.findFirst({
      where: { room_name: roomName, deleted_at: null },
    })
    if (!room) return notFoundResponse('Prayer room')

    const body = await req.json()
    const { identity, muted } = ModerateSchema.parse(body)

    // Fetch current permission and send the full set back rather than a
    // sparse patch -- LiveKit's updateParticipant permission argument isn't
    // guaranteed to merge server-side, so an incomplete object risks
    // silently clobbering canPublish/canSubscribe too.
    const participant = await roomService.getParticipant(roomName, identity)
    const current = participant.permission

    await roomService.updateParticipant(roomName, identity, undefined, {
      canSubscribe: current?.canSubscribe ?? true,
      canPublish: current?.canPublish ?? false,
      canPublishData: !muted,
      hidden: current?.hidden ?? false,
    })

    return successResponse({ identity, muted }, muted ? 'Participant muted.' : 'Participant unmuted.')
  } catch (error) {
    if (error instanceof z.ZodError) return validationErrorResponse(error)
    console.error('[prayer-live] moderate failed:', error)
    return serverErrorResponse()
  }
})
