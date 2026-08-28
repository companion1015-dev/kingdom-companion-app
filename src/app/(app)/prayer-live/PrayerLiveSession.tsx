'use client'

import { useEffect, useRef, useState } from 'react'
import {
  LiveKitRoom,
  GridLayout,
  ParticipantTile,
  RoomAudioRenderer,
  ControlBar,
  Chat,
  useTracks,
  useLocalParticipant,
  useRoomContext,
  ConnectionStateToast,
} from '@livekit/components-react'
import '@livekit/components-styles'
import { Track, VideoPresets, type RoomOptions } from 'livekit-client'
import { MessageSquare, Ear, EarOff, Volume2, VolumeX, Play, Pause, Square } from 'lucide-react'

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
  // Visitor-only local playback controls -- muting/pausing here only affects
  // what this viewer sees/hears, it never touches the room for anyone else.
  const [muted, setMuted] = useState(false)
  const [paused, setPaused] = useState(false)

  return (
    <div className="relative h-screen flex flex-col bg-navy">
      <header className="flex items-center gap-3 p-4">
        <h1 className="font-display text-lg font-medium text-white">{title}</h1>
        {!canPublish && (
          <span className="text-xs font-body px-2.5 py-0.5 rounded-full bg-white/10 text-white/60">Watching</span>
        )}
      </header>

      {paused ? (
        <div className="flex items-center justify-center text-white/40 font-body text-sm" style={{ height: 'calc(100vh - 180px)' }}>
          Paused
        </div>
      ) : (
        <GridLayout tracks={tracks} style={{ height: 'calc(100vh - 180px)' }}>
          <ParticipantTile />
        </GridLayout>
      )}

      {!muted && <RoomAudioRenderer />}

      <div className="flex gap-2 p-4">
        <button
          onClick={() => setChatOpen((v) => !v)}
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 hover:bg-white/15 text-white/80 text-sm font-body transition-colors"
        >
          <MessageSquare className="w-3.5 h-3.5" /> {chatOpen ? 'Hide chat' : 'Chat'}
        </button>
        {canPublish && <SelfMonitorToggle />}
        {canPublish && <ControlBar controls={{ chat: false, screenShare: true }} />}
        {!canPublish && (
          <VisitorControls
            muted={muted}
            paused={paused}
            onToggleMute={() => setMuted((v) => !v)}
            onTogglePause={() => setPaused((v) => !v)}
          />
        )}
      </div>

      {chatOpen && (
        <Chat style={{ position: 'absolute', right: 0, top: 0, height: '100%', width: 320 }} />
      )}
    </div>
  )
}

/**
 * Watch-only controls -- these are all local to this viewer's own playback
 * (muting/pausing here never affects the room or other participants). Stop
 * disconnects from LiveKit and hands off to the page's onLeave, same as the
 * host's ControlBar "leave" button.
 */
function VisitorControls({
  muted,
  paused,
  onToggleMute,
  onTogglePause,
}: {
  muted: boolean
  paused: boolean
  onToggleMute: () => void
  onTogglePause: () => void
}) {
  const room = useRoomContext()

  // room.disconnect() triggers LiveKitRoom's onDisconnected (wired to
  // onLeave) automatically, same as how the host's ControlBar leave
  // button works -- no need to call onLeave here too.
  function handleStop() {
    room.disconnect()
  }

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={onToggleMute}
        className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 hover:bg-white/15 text-white/80 text-sm font-body transition-colors"
      >
        {muted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
        {muted ? 'Unmute' : 'Mute'}
      </button>
      <button
        onClick={onTogglePause}
        className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 hover:bg-white/15 text-white/80 text-sm font-body transition-colors"
      >
        {paused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
        {paused ? 'Play' : 'Pause'}
      </button>
      <button
        onClick={handleStop}
        className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-red-600 hover:bg-red-700 text-white text-sm font-body transition-colors"
      >
        <Square className="w-3.5 h-3.5" /> Stop
      </button>
    </div>
  )
}

/**
 * Opt-in only, off by default -- RoomAudioRenderer deliberately never plays
 * back the local participant's own mic (standard across every video-call
 * app, avoids echo). Looping it back on request is fine for a host on
 * headphones, but would cause real feedback squeal for a host on a
 * speaker/PA setup, hence the explicit toggle instead of always-on.
 */
function SelfMonitorToggle() {
  const { microphoneTrack } = useLocalParticipant()
  const [monitoring, setMonitoring] = useState(false)
  const elRef = useRef<HTMLMediaElement | null>(null)

  useEffect(() => {
    const track = microphoneTrack?.track
    if (!monitoring || !track) return

    const el = track.attach()
    el.style.display = 'none'
    document.body.appendChild(el)
    elRef.current = el

    return () => {
      track.detach(el)
      el.remove()
      elRef.current = null
    }
  }, [monitoring, microphoneTrack])

  return (
    <button
      onClick={() => setMonitoring((v) => !v)}
      title="Hear your own mic -- use headphones to avoid feedback"
      className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-sm font-body transition-colors ${
        monitoring ? 'bg-gold text-navy' : 'bg-white/10 hover:bg-white/15 text-white/80'
      }`}
    >
      {monitoring ? <Ear className="w-3.5 h-3.5" /> : <EarOff className="w-3.5 h-3.5" />}
      {monitoring ? 'Monitoring' : 'Monitor my audio'}
    </button>
  )
}
