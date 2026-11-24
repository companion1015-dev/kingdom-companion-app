import { AccessToken, RoomServiceClient } from 'livekit-server-sdk'

export const PRAYER_LIVE_ROLES = {
  VISITOR: 'visitor',
  USER: 'user',
  INTERCESSOR: 'intercessor',
  WORSHIP_LEADER: 'worship_leader',
  HOST: 'host',
  ADMIN: 'admin',
  SUPER_ADMIN: 'super_admin',
} as const

const HOST_ROLES = ['host','admin','super_admin','worship_leader','intercessor']

function isHostRole(role: string) {
  return HOST_ROLES.includes(role)
}

function getLiveKitKeys() {
  const url = process.env.LIVEKIT_URL
  const apiKey = process.env.LIVEKIT_API_KEY
  const apiSecret = process.env.LIVEKIT_API_SECRET
  if (!url || !apiKey || !apiSecret) {
    throw new Error(`LIVEKIT env missing: ${!url?'LIVEKIT_URL ':''}${!apiKey?'LIVEKIT_API_KEY ':''}${!apiSecret?'LIVEKIT_API_SECRET':''}`.trim())
  }
  return { url, apiKey, apiSecret }
}

export async function issuePrayerLiveToken({ roomName, identity, displayName, role }: {
  roomName: string, identity: string, displayName: string, role: string
}) {
  const { url, apiKey, apiSecret } = getLiveKitKeys()
  
  const at = new AccessToken(apiKey, apiSecret, { 
    identity, 
    name: displayName,
    metadata: JSON.stringify({ role })
  })

  const isHost = isHostRole(role)
  const canPublish = isHost // only hosts can publish

  at.addGrant({
    roomJoin: true,
    room: roomName,
    canPublish,
    canSubscribe: true,
    canPublishData: role !== PRAYER_LIVE_ROLES.VISITOR,
  })

  const token = await at.toJwt()
  return { token, url, role, canPublish }
}

export const roomService = (() => {
  try {
    const { url, apiKey, apiSecret } = getLiveKitKeys()
    return new RoomServiceClient(url, apiKey, apiSecret)
  } catch {
    // Return mock that doesn't crash build
    return {
      createRoom: async () => { console.warn('LiveKit not configured - mock createRoom') },
    } as any
  }
})()
