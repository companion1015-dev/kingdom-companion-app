import { notFoundResponse, successResponse, serverErrorResponse } from '@/lib/api-response'
import { prisma } from '@/lib/db/client'

/**
 * GET /api/v1/prayer-live/rooms/:roomName/recordings
 * Public -- past recordings are for anyone who missed the live session,
 * same audience as watching would have been.
 */
export async function GET(_req: Request, context: { params: { roomName: string } }) {
  const roomName = context.params.roomName

  try {
    const room = await prisma.prayerLiveRoom.findFirst({
      where: { room_name: roomName, deleted_at: null },
    })
    if (!room) return notFoundResponse('Prayer room')

    const recordings = await prisma.prayerLiveRecording.findMany({
      where: { room_id: room.id, status: 'ready' },
      orderBy: { started_at: 'desc' },
      select: { id: true, file_url: true, duration_seconds: true, started_at: true },
    })

    return successResponse(recordings, 'Recordings retrieved successfully.')
  } catch (error) {
    console.error('[prayer-live] list recordings failed:', error)
    return serverErrorResponse()
  }
}
