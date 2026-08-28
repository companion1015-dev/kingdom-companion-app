export interface RoomSummary {
  room_name: string
  title: string
  is_live: boolean
  started_at: string | null
  scheduled_at: string | null
}

export async function listRooms(): Promise<RoomSummary[]> {
  const res = await fetch('/api/v1/prayer-live/rooms')
  if (!res.ok) throw new Error('Failed to load prayer rooms.')
  const body = await res.json()
  return body.data ?? body
}

export async function getHostStatus(): Promise<boolean> {
  try {
    const res = await fetch('/api/v1/prayer-live/me')
    if (!res.ok) return false
    const body = await res.json()
    return !!body.data?.isHost
  } catch {
    return false
  }
}

export async function createRoom(roomName: string, title: string) {
  const res = await fetch('/api/v1/prayer-live/rooms', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ room_name: roomName, title }),
  })
  const body = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(body.error?.message ?? 'Failed to schedule room.')
  }
}

export async function startRoom(roomName: string, record = false) {
  const res = await fetch(`/api/v1/prayer-live/rooms/${encodeURIComponent(roomName)}/start`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ record }),
  })
  const body = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(body.error?.message ?? 'Failed to start session.')
  }
  return body.data?.recordingError as string | undefined
}

export interface Recording {
  id: string
  file_url: string
  duration_seconds: number | null
  started_at: string
}

export async function listRecordings(roomName: string): Promise<Recording[]> {
  const res = await fetch(`/api/v1/prayer-live/rooms/${encodeURIComponent(roomName)}/recordings`)
  if (!res.ok) return []
  const body = await res.json().catch(() => ({}))
  return body.data ?? []
}

export async function endRoom(roomName: string) {
  const res = await fetch(`/api/v1/prayer-live/rooms/${encodeURIComponent(roomName)}/end`, {
    method: 'POST',
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.error?.message ?? 'Failed to end session.')
  }
}

export async function moderateParticipant(roomName: string, identity: string, muted: boolean) {
  const res = await fetch(`/api/v1/prayer-live/rooms/${encodeURIComponent(roomName)}/moderate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identity, muted }),
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.error?.message ?? 'Failed to update participant.')
  }
}
