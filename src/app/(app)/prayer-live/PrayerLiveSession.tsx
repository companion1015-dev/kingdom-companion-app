'use client'

import { useEffect, useState } from 'react'
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
import { MessageSquare } from 'lucide-react'

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

async function getToken(roomName: string): Promise<TokenResponse> {
  const res = await fetch(`/api/v1/prayer-live/rooms/${encodeURIComponent(roomName)}/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({}),
  })
  const body = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(body.error?.message ?? 'This session is not currently live.')
  }
  return body.data
}

export default function PrayerLiveSession({ roomName, title, onLeave }: { roomName: string; title: string; onLeave: () => void }) {
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
