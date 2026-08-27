import { NextRequest, NextResponse } from 'next/server'
import { withOptionalAuth } from '@/lib/auth/middleware'
import { prisma } from '@/lib/db/client'
import { issuePrayerLiveToken, PRAYER_LIVE_ROLES } from '@/lib/prayer-live/livekit'
import { randomUUID } from 'crypto'

/**
 * POST /api/v1/prayer-live/rooms/:roomName/token
 *
 * The permission-issuing core of the feature (blueprint Section 2 & 3):
 *  - No session (user === null)        -> Visitor: subscribe-only, hidden, no chat
 *  - Logged in, default role "user"    -> can chat, cannot publish
 *  - intercessor / worship_leader /    -> can publish camera+mic (stage-eligible)
 *    host / admin / super_admin
 *
 * Role is resolved server-side from the verified session (withOptionalAuth) —
 * never trusted from the request body.
 */
export const POST = withOptionalAuth(async (req: NextRequest, user, context) => {
  const roomName = context?.params.roomName
  if (!roomName) {
    return NextResponse.json({ error: 'Prayer room not found.' }, { status: 404 })
  }

  const room = await prisma.prayerLiveRoom.findFirst({
    where: { room_name: roomName, deleted_at: null },
  })

  if (!room || !room.is_live) {
    return NextResponse.json({ error: 'This session is not currently live.' }, { status: 404 })
  }

  let displayName: string | undefined
  try {
    const body = await req.json()
    displayName = typeof body?.displayName === 'string' ? body.displayName : undefined
  } catch {
    // no body provided — fine, displayName is optional
  }

  const identity = user?.id ?? `visitor-${randomUUID()}`
  const role = user?.role ?? PRAYER_LIVE_ROLES.VISITOR
  const name = displayName || user?.email?.split('@')[0] || 'Guest'

  try {
    const result = await issuePrayerLiveToken({ roomName, identity, displayName: name, role })
    return NextResponse.json(result)
  } catch (error) {
    console.error('[prayer-live] token issuance failed:', error)
    return NextResponse.json({ error: 'Unable to issue a session token. Please try again.' }, { status: 500 })
  }
})
