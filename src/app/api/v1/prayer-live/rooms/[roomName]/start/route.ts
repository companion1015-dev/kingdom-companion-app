import { NextRequest } from 'next/server'
import { withAuth } from '@/lib/auth/middleware'
import { forbiddenResponse, notFoundResponse, successResponse, serverErrorResponse } from '@/lib/api-response'
import { prisma } from '@/lib/db/client'
import { roomService, isHostRole } from '@/lib/prayer-live/livekit'
import { startRecording } from '@/lib/prayer-live/recording'

/**
 * POST /api/v1/prayer-live/rooms/:roomName/start
 * Host-only (blueprint Section 3: Host "Starts/ends streams").
 * Optional body: { record?: boolean } -- host opt-in per session, never
 * automatic (avoids recording/storage cost for casual or test sessions).
 */
export const POST = withAuth(async (req: NextRequest, user, context) => {
  const roomName = context?.params.roomName

  if (!roomName) {
    return notFoundResponse('Prayer room')
  }

  if (!isHostRole(user.role)) {
    return forbiddenResponse('Only a Host can start this session.')
  }

  let record = false
  try {
    const body = await req.json()
    record = body?.record === true
  } catch {
    // no body provided -- fine, defaults to not recording
  }

  try {
    const room = await prisma.prayerLiveRoom.findFirst({
      where: { room_name: roomName, deleted_at: null },
    })

    if (!room) {
      return notFoundResponse('Prayer room')
    }

    try {
      await roomService.createRoom({
        name: roomName,
        emptyTimeout: 10 * 60,
        departureTimeout: 20,
        maxParticipants: 0,
        metadata: JSON.stringify({ hostId: user.id }),
      })
    } catch (err) {
      const message = err instanceof Error ? err.message : ''
      if (!message.includes('already exists')) {
        console.error('[prayer-live] createRoom failed', err)
        return serverErrorResponse()
      }
    }

    const updated = await prisma.prayerLiveRoom.update({
      where: { id: room.id },
      data: { is_live: true, host_id: user.id, started_at: new Date(), ended_at: null },
    })

    let recordingError: string | undefined
    if (record) {
      try {
        const { egressId, filepath } = await startRecording(roomName)
        await prisma.prayerLiveRecording.create({
          data: { room_id: room.id, egress_id: egressId, filepath, status: 'recording' },
        })
      } catch (err) {
        // Recording is opt-in extra, not core to the session -- a failure
        // here (e.g. storage not configured yet) shouldn't block going live.
        console.error('[prayer-live] startRecording failed:', err)
        recordingError = err instanceof Error ? err.message : 'Recording could not be started.'
      }
    }

    return successResponse({ ...updated, recordingError }, 'Session started.')
  } catch (error) {
    console.error('[prayer-live] start session failed:', error)
    return serverErrorResponse()
  }
})
