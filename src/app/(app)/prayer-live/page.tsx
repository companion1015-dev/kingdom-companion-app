'use client'

import { useEffect, useState, useCallback } from 'react'
import {
  LiveKitRoom,
  GridLayout,
  ParticipantTile,
  RoomAudioRenderer,
  ControlBar,
  Chat,
  useTracks,
  ConnectionStateToast,
} from '@livekit/components-react'
import '@livekit/components-styles'
import { Track, VideoPresets, type RoomOptions } from 'livekit-client'
import { Radio, Users, MessageSquare } from 'lucide-react'
import Navigation from '@/components/layout/Navigation'
import Footer from '@/components/layout/Footer'

interface RoomSummary {
  room_name: string
  title: string
  is_live: boolean
  started_at: string | null
  scheduled_at: string | null
}

interface TokenResponse {
  token: string
  url: string
  identity: string
  role: string
  canPublish: boolean
  canModerate: boolean
}

const ROOM_OPTIONS: RoomOptions = {
  adaptiveStream: true,
  dynacast: true,
  videoCaptureDefaults: {
    resolution: VideoPresets.h360.resolution,
  },
  publishDefaults: {
    videoEncoding: VideoPresets.h360.encoding,
    simulcast: true,
  },
}

async function listRooms(): Promise<RoomSummary[]> {
  const res = await fetch('/api/v1/prayer-live/rooms')
  if (!res.ok) throw new Error('Failed to load prayer rooms.')
  const body = await res.json()
  return body.data ?? body
}

async function startRoom(roomName: string) {
  const res = await fetch(`/api/v1/prayer-live/rooms/${encodeURIComponent(roomName)}/start`, {
    method: 'POST',
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.error ?? body.message ?? 'Failed to start session.')
  }
}

async function endRoom(roomName: string) {
  const res = await fetch(`/api/v1/prayer-live/rooms/${encodeURIComponent(roomName)}/end`, {
    method: 'POST',
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.error ?? body.message ?? 'Failed to end session.')
  }
}

async function getToken(roomName: string): Promise<TokenResponse> {
  const res = await fetch(`/api/v1/prayer-live/rooms/${encodeURIComponent(roomName)}/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({}),
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.error ?? 'This session is not currently live.')
  }
  return res.json()
}

export default function PrayerLivePage() {
  const [rooms, setRooms] = useState<RoomSummary[]>([])
  const [loadError, setLoadError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeRoom, setActiveRoom] = useState<string | null>(null)

  const refresh = useCallback(() => {
    listRooms()
      .then(rooms => { setRooms(rooms); setLoadError(null) })
      .catch((err) => setLoadError(err.message))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    refresh()
    const interval = setInterval(refresh, 8000)
    return () => clearInterval(interval)
  }, [refresh])

  // The active session is a full-screen, immersive video call -- deliberately
  // rendered without the site's Navigation/Footer chrome around it, same as
  // any video-conferencing UI.
  if (activeRoom) {
    const room = rooms.find((r) => r.room_name === activeRoom)
    return (
      <PrayerLiveSession
        roomName={activeRoom}
        title={room?.title ?? activeRoom}
        onLeave={() => setActiveRoom(null)}
      />
    )
  }

  return (
    <div className="min-h-screen bg-cream dark:bg-navy-dark-gradient">
      <Navigation />

      <main className="max-w-3xl mx-auto px-4 sm:px-6 pt-28 pb-16">
        <div className="flex items-center gap-3 mb-2">
          <Radio className="w-6 h-6 text-gold" />
          <h1 className="font-display text-3xl font-light text-navy dark:text-cream">Live Prayer</h1>
        </div>
        <p className="text-navy/60 dark:text-cream/60 font-body text-sm mb-8">
          Join a live, video-based corporate prayer session — watch freely without an account, or sign in to join the conversation.
        </p>

        {loading && (
          <div className="space-y-3 animate-pulse">
            {[0, 1].map(i => (
              <div key={i} className="h-24 rounded-2xl bg-navy/6 dark:bg-cream/6" />
            ))}
          </div>
        )}

        {loadError && (
          <p className="text-sm font-body text-red-600 bg-red-50 border border-red-100 rounded-xl p-4 mb-4">{loadError}</p>
        )}

        {!loading && (
          <ul className="space-y-3">
            {rooms.map((room) => (
              <li key={room.room_name} className="bg-white dark:bg-navy-dark rounded-2xl border border-navy/8 p-5 sm:p-6">
                <div className="flex items-center gap-2.5 mb-3">
                  <h2 className="font-display text-lg font-medium text-navy dark:text-cream">{room.title}</h2>
                  <span
                    className={`inline-flex items-center gap-1 text-xs font-body font-semibold px-2.5 py-0.5 rounded-full ${
                      room.is_live
                        ? 'bg-red-600/10 text-red-600'
                        : 'bg-navy/6 text-navy/40 dark:bg-cream/6 dark:text-cream/40'
                    }`}
                  >
                    {room.is_live && <span className="w-1.5 h-1.5 rounded-full bg-red-600 animate-pulse" />}
                    {room.is_live ? 'LIVE' : 'Offline'}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  {room.is_live && (
                    <button
                      onClick={() => setActiveRoom(room.room_name)}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-navy hover:bg-navy-light text-white text-sm font-body font-medium transition-colors"
                    >
                      <Users className="w-3.5 h-3.5" /> Watch now
                    </button>
                  )}

                  <HostControls
                    roomName={room.room_name}
                    isLive={room.is_live}
                    onChanged={refresh}
                    onEnterStage={() => setActiveRoom(room.room_name)}
                  />
                </div>
              </li>
            ))}
          </ul>
        )}

        {!loading && rooms.length === 0 && !loadError && (
          <p className="text-navy/40 dark:text-cream/40 font-body text-sm text-center py-12">
            No prayer sessions scheduled yet.
          </p>
        )}
      </main>

      <Footer />
    </div>
  )
}

function HostControls({
  roomName,
  isLive,
  onChanged,
  onEnterStage,
}: {
  roomName: string
  isLive: boolean
  onChanged: () => void
  onEnterStage: () => void
}) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleStart() {
    setBusy(true)
    setError(null)
    try {
      await startRoom(roomName)
      onChanged()
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setBusy(false)
    }
  }

  async function handleEnd() {
    if (!confirm('End the session for everyone watching?')) return
    setBusy(true)
    setError(null)
    try {
      await endRoom(roomName)
      onChanged()
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <details className="group">
      <summary className="text-xs font-body text-navy/35 dark:text-cream/35 cursor-pointer select-none hover:text-navy/60 dark:hover:text-cream/60 transition-colors list-none">
        Host controls
      </summary>
      <div className="mt-3 flex items-center gap-2">
        {error && <span className="text-red-600 text-xs font-body">{error}</span>}
        {!isLive ? (
          <button
            disabled={busy}
            onClick={handleStart}
            className="px-3.5 py-1.5 rounded-full bg-gold hover:bg-gold-light text-navy text-xs font-body font-semibold transition-colors disabled:opacity-60"
          >
            {busy ? 'Starting…' : 'Go live'}
          </button>
        ) : (
          <>
            <button
              disabled={busy}
              onClick={onEnterStage}
              className="px-3.5 py-1.5 rounded-full border border-navy/15 text-navy/70 dark:text-cream/70 hover:border-navy/30 text-xs font-body font-medium transition-colors"
            >
              Enter stage
            </button>
            <button
              disabled={busy}
              onClick={handleEnd}
              className="px-3.5 py-1.5 rounded-full bg-red-600 hover:bg-red-700 text-white text-xs font-body font-semibold transition-colors disabled:opacity-60"
            >
              {busy ? 'Ending…' : 'End session'}
            </button>
          </>
        )}
      </div>
    </details>
  )
}

function PrayerLiveSession({ roomName, title, onLeave }: { roomName: string; title: string; onLeave: () => void }) {
  const [session, setSession] = useState<TokenResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [connecting, setConnecting] = useState(true)

  useEffect(() => {
    let cancelled = false
    setConnecting(true)
    setError(null)
    getToken(roomName)
      .then((res) => {
        if (!cancelled) setSession(res)
      })
      .catch((err) => {
        if (!cancelled) setError(err.message ?? 'Could not join this session.')
      })
      .finally(() => {
        if (!cancelled) setConnecting(false)
      })
    return () => {
      cancelled = true
    }
  }, [roomName])

  if (connecting) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-navy gap-3">
        <div className="w-6 h-6 border-2 border-white/20 border-t-gold rounded-full animate-spin" />
        <p className="text-white/70 font-body text-sm">Joining {title}…</p>
      </div>
    )
  }

  if (error || !session) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-navy gap-4 px-4 text-center">
        <p className="text-white/70 font-body text-sm">{error ?? 'This session has ended or is not live yet.'}</p>
        <button
          onClick={onLeave}
          className="px-5 py-2 rounded-full bg-gold hover:bg-gold-light text-navy text-sm font-body font-semibold transition-colors"
        >
          Back
        </button>
      </div>
    )
  }

  return (
    <LiveKitRoom
      video={session.canPublish}
      audio={session.canPublish}
      token={session.token}
      serverUrl={session.url}
      options={ROOM_OPTIONS}
      connect
      data-lk-theme="default"
      style={{ height: '100vh' }}
      onDisconnected={onLeave}
    >
      <SessionLayout canPublish={session.canPublish} title={title} />
      <RoomAudioRenderer />
      <ConnectionStateToast />
    </LiveKitRoom>
  )
}

function SessionLayout({ canPublish, title }: { canPublish: boolean; title: string }) {
  const tracks = useTracks(
    [
      { source: Track.Source.Camera, withPlaceholder: true },
      { source: Track.Source.ScreenShare, withPlaceholder: false },
    ],
    { onlySubscribed: false },
  )

  const [chatOpen, setChatOpen] = useState(false)

  return (
    <div className="relative h-screen flex flex-col bg-navy">
      <header className="flex items-center gap-3 p-4">
        <h1 className="font-display text-lg font-medium text-white">{title}</h1>
        {!canPublish && (
          <span className="text-xs font-body px-2.5 py-0.5 rounded-full bg-white/10 text-white/60">Watching</span>
        )}
      </header>

      <GridLayout tracks={tracks} style={{ height: 'calc(100vh - 180px)' }}>
        <ParticipantTile />
      </GridLayout>

      <div className="flex gap-2 p-4">
        <button
          onClick={() => setChatOpen((v) => !v)}
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 hover:bg-white/15 text-white/80 text-sm font-body transition-colors"
        >
          <MessageSquare className="w-3.5 h-3.5" /> {chatOpen ? 'Hide chat' : 'Chat'}
        </button>
        {canPublish && <ControlBar controls={{ chat: false, screenShare: true }} />}
      </div>

      {chatOpen && (
        <Chat style={{ position: 'absolute', right: 0, top: 0, height: '100%', width: 320 }} />
      )}
    </div>
  )
}
