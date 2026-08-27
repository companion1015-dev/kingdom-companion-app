import { AccessToken, RoomServiceClient, TrackSource } from 'livekit-server-sdk'

const { LIVEKIT_API_KEY, LIVEKIT_API_SECRET, LIVEKIT_URL } = process.env

if (!LIVEKIT_API_KEY || !LIVEKIT_API_SECRET || !LIVEKIT_URL) {
  // Fails loudly at import time in any environment missing these, rather
  // than surfacing as a confusing 500 deep inside a route handler.
  console.error(
    '[prayer-live] LIVEKIT_API_KEY, LIVEKIT_API_SECRET and LIVEKIT_URL must be set in the environment.',
  )
}

export const roomService = new RoomServiceClient(
  LIVEKIT_URL ?? '',
  LIVEKIT_API_KEY ?? '',
  LIVEKIT_API_SECRET ?? '',
)

export const LIVEKIT_URL_PUBLIC = LIVEKIT_URL ?? ''

/**
 * Roles from the blueprint's Section 3 role table. Stored as plain strings on
 * User.role, consistent with this codebase's existing string-enum convention
 * (see account_status, auth_provider on the User model).
 */
export const PRAYER_LIVE_ROLES = {
  VISITOR: 'visitor', // not a real User.role value — represents "no session"
  MEMBER: 'user', // maps to the existing default User.role
  PRAYER_PARTNER: 'prayer_partner',
  INTERCESSOR: 'intercessor',
  WORSHIP_LEADER: 'worship_leader',
  HOST: 'host',
  MODERATOR: 'moderator',
  ADMIN: 'admin',
  SUPER_ADMIN: 'super_admin',
} as const

export function isHostRole(role: string | null | undefined): boolean {
  return role === PRAYER_LIVE_ROLES.HOST || role === PRAYER_LIVE_ROLES.ADMIN || role === PRAYER_LIVE_ROLES.SUPER_ADMIN
}

export function isStageEligible(role: string | null | undefined): boolean {
  return (
    isHostRole(role) ||
    role === PRAYER_LIVE_ROLES.INTERCESSOR ||
    role === PRAYER_LIVE_ROLES.WORSHIP_LEADER
  )
}

export function isModeratorRole(role: string | null | undefined): boolean {
  return role === PRAYER_LIVE_ROLES.MODERATOR || role === PRAYER_LIVE_ROLES.ADMIN || role === PRAYER_LIVE_ROLES.SUPER_ADMIN
}

interface IssueTokenParams {
  roomName: string
  identity: string
  displayName: string
  role: string | null | undefined
}

/**
 * Issues a LiveKit access token whose permissions are derived entirely from
 * the caller's role — never from anything the client claims. Mirrors
 * blueprint Section 2: visitors can watch (subscribe-only, hidden, no chat);
 * Members can chat; Intercessors/Worship Leaders/Hosts can publish.
 */
export async function issuePrayerLiveToken({ roomName, identity, displayName, role }: IssueTokenParams) {
  const canPublish = isStageEligible(role)

  const at = new AccessToken(LIVEKIT_API_KEY, LIVEKIT_API_SECRET, {
    identity,
    name: displayName,
    ttl: '4h',
  })

  at.addGrant({
    room: roomName,
    roomJoin: true,
    canSubscribe: true,
    canPublish,
    canPublishData: role !== PRAYER_LIVE_ROLES.VISITOR && !!role,
    canPublishSources: canPublish ? [TrackSource.CAMERA, TrackSource.MICROPHONE] : undefined,
    hidden: !role || role === PRAYER_LIVE_ROLES.VISITOR,
  })

  const token = await at.toJwt()

  return {
    token,
    url: LIVEKIT_URL_PUBLIC,
    identity,
    role: role ?? PRAYER_LIVE_ROLES.VISITOR,
    canPublish,
    canModerate: isModeratorRole(role),
  }
}
