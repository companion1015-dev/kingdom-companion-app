import { NextRequest } from 'next/server'
import { withAuth } from '@/lib/auth/middleware'
import { forbiddenResponse, notFoundResponse, successResponse, serverErrorResponse } from '@/lib/api-response'
import { prisma } from '@/lib/db/client'
import { roomService, isHostRole } from '@/lib/prayer-live/livekit'

/**
 * POST /api/v1/prayer-live/rooms/:roomName/end
 * Host-only. Ends the session for everyone connected.
 */
export const POST = withAuth(async (_req: NextRequest, user, context) => {
  const roomName = context?.params.roomName

  if (!roomName) {
    return notFoundResponse('Prayer room')
  }

  if (!isHostRole(user.role)) {
    return forbiddenResponse('Only a Host can end this session.')
  }

  try {
    const room = await prisma.prayerLiveRoom.findFirst({
      where: { room_name: roomName, deleted_at: null },
    })

    if (!room) {
      return notFoundResponse('Prayer room')
    }

    try {
      await roomService.deleteRoom(roomName)
    } catch (err) {
      console.warn('[prayer-live] deleteRoom warning (room may already be gone):', err)
    }

    const updated = await prisma.prayerLiveRoom.update({
      where: { id: room.id },
      data: { is_live: false, ended_at: new Date() },
    })

    return successResponse(updated, 'Session ended.')
  } catch (error) {
    console.error('[prayer-live] end session failed:', error)
    return serverErrorResponse()
  }
})
