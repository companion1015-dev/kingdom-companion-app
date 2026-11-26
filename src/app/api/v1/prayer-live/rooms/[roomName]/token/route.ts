import { NextRequest } from 'next/server'
import { withOptionalAuth } from '@/lib/auth/middleware'
import { prisma } from '@/lib/db/client'
import { issuePrayerLiveToken, PRAYER_LIVE_ROLES } from '@/lib/prayer-live/livekit'
import { errorResponse, notFoundResponse, successResponse, serverErrorResponse } from '@/lib/api-response'
import { randomUUID } from 'crypto'

export const dynamic = 'force-dynamic'

const HOST_ROLES = ['host','admin','super_admin','worship_leader','intercessor']

export const POST = withOptionalAuth(async (req: NextRequest, user, context) => {
  const roomName = context?.params.roomName
  if (!roomName) return notFoundResponse('Prayer room')

  try {
    const room = await prisma.prayerLiveRoom.findFirst({
      where: { room_name: roomName, deleted_at: null },
    })
    if (!room) return notFoundResponse('Prayer room')

    // FIX: Allow hosts to get token even when offline to START the session
    const role = user?.role ?? PRAYER_LIVE_ROLES.VISITOR
    const isHost = HOST_ROLES.includes(role)
    
    if (!room.is_live && !isHost) {
      return errorResponse('SESSION_NOT_LIVE', 'This session is not currently live.', 404)
    }

    let displayName: string | undefined
    try {
      const body = await req.json()
      displayName = typeof body?.displayName === 'string' ? body.displayName : undefined
    } catch {}

    const identity = user?.id ?? `visitor-${randomUUID()}`
    const name = displayName || user?.email?.split('@')[0] || 'Guest'

    const result = await issuePrayerLiveToken({ roomName, identity, displayName: name, role })
    return successResponse(result, 'Session token issued.')
  } catch (error) {
    console.error('[prayer-live] token issuance failed:', error)
    return serverErrorResponse('Unable to issue a session token. Please try again.')
  }
})
