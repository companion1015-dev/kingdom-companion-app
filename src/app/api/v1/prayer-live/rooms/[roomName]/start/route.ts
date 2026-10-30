export const dynamic = 'force-dynamic'
import { NextRequest } from 'next/server'
import { withAuth } from '@/lib/auth/middleware'
import { forbiddenResponse, notFoundResponse, successResponse, serverErrorResponse } from '@/lib/api-response'
import { prisma } from '@/lib/db/client'
import { isHostRole } from '@/lib/prayer-live/livekit'
import { startRecording } from '@/lib/prayer-live/recording'

/**
 * POST /api/v1/prayer-live/rooms/:roomName/start
 * RECTIFIED: Recording is OPTIONAL, LiveKit room creation is OPTIONAL
 * Host can always go live.
 */
export const POST = withAuth(async (req: NextRequest, user, context) => {
  const roomName = context?.params.roomName
  if (!roomName) return notFoundResponse('Prayer room')
  if (!isHostRole(user.role)) return forbiddenResponse('Only a Host can start this session.')

  let record = false
  try {
    const body = await req.json()
    record = body?.record === true
  } catch {}

  try {
    const room = await prisma.prayerLiveRoom.findFirst({
      where: { room_name: roomName, deleted_at: null },
    })
    if (!room) return notFoundResponse('Prayer room')

    // 1. Try create LiveKit room, but DON'T FAIL if it errors
    try {
      const { roomService } = await import('@/lib/prayer-live/livekit')
      await roomService.createRoom({
        name: roomName,
        emptyTimeout: 10 * 60,
        departureTimeout: 20,
        maxParticipants: 0,
        metadata: JSON.stringify({ hostId: user.id }),
      })
    } catch (err) {
      console.warn('[prayer-live] createRoom skipped (LiveKit env missing):', err)
      // Continue anyway - we can still mark DB as live
    }

    // 2. Mark as live in DB (THIS IS THE CORE)
    const updated = await prisma.prayerLiveRoom.update({
      where: { id: room.id },
      data: { is_live: true, host_id: user.id, started_at: new Date(), ended_at: null },
    })

    // 3. Recording is FULLY OPTIONAL
    let recordingError: string | undefined
    let recordingDisabled = true
    if (record) {
      try {
        const { egressId, filepath } = await startRecording(roomName)
        await prisma.prayerLiveRecording.create({
          data: { room_id: room.id, egress_id: egressId, filepath, status: 'recording' },
        })
        recordingDisabled = false
      } catch (err) {
        console.error('[prayer-live] startRecording failed (expected if R2 not set):', err)
        recordingError = 'Recording disabled - R2 storage not configured. Live will continue without recording.'
        recordingDisabled = true
      }
    }

    return successResponse({ ...updated, recordingError, recordingDisabled }, 'Session started - Live without recording.')
  } catch (error) {
    console.error('[prayer-live] start session failed:', error)
    return serverErrorResponse()
  }
})
