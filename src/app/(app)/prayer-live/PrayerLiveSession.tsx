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
  useRemoteParticipants,
  useRoomContext,
  ConnectionStateToast,
} from '@livekit/components-react'
import '@livekit/components-styles'
import { Track, VideoPresets, type RoomOptions } from 'livekit-client'
import { MessageSquare, Ear, EarOff, Volume2, VolumeX, Play, Pause, Square, HandHeart, Shield, MicOff, Mic } from 'lucide-react'
import SubmitPrayerForm from '@/modules/prayer-wall/components/SubmitPrayerForm'
import { moderateParticipant } from './lib'

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
      <SessionLayout
        canPublish={session.canPublish}
        canModerate={session.canModerate}
        roomName={roomName}
        title={title}
      />
      <ConnectionStateToast />
    </LiveKitRoom>
  )
}

function SessionLayout({
  canPublish,
  canModerate,
  roomName,
  title,
}: {
  canPublish: boolean
  canModerate: boolean
  roomName: string
  title: string
}) {
  const tracks = useTracks(
    [
      { source: Track.Source.Camera, withPlaceholder: true },
      { source: Track.Source.ScreenShare, withPlaceholder: false },
    ],
    { onlySubscribed: false },
  )

  const [chatOpen, setChatOpen] = useState(false)
  const [prayerFormOpen, setPrayerFormOpen] = useState(false)
  const [prayerSubmitted, setPrayerSubmitted] = useState(false)
  const [moderateOpen, setModerateOpen] = useState(false)
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

      <div className="flex flex-wrap gap-2 p-4">
        <button
          onClick={() => setChatOpen((v) => !v)}
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 hover:bg-white/15 text-white/80 text-sm font-body transition-colors"
        >
          <MessageSquare className="w-3.5 h-3.5" /> {chatOpen ? 'Hide chat' : 'Chat'}
        </button>
        <button
          onClick={() => setPrayerFormOpen(true)}
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 hover:bg-white/15 text-white/80 text-sm font-body transition-colors"
        >
          <HandHeart className="w-3.5 h-3.5" /> Prayer request
        </button>
        {canModerate && (
          <button
            onClick={() => setModerateOpen((v) => !v)}
            className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-sm font-body transition-colors ${
              moderateOpen ? 'bg-gold text-navy' : 'bg-white/10 hover:bg-white/15 text-white/80'
            }`}
          >
            <Shield className="w-3.5 h-3.5" /> Moderate
          </button>
        )}
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
        <>
          <Chat style={{ position: 'absolute', right: 0, top: 0, height: '100%', width: 320 }} />
          {/* LiveKit ships no explicit color/background on its own chat input --
              it relies on inheriting from [data-lk-theme], which is fragile
              across browsers/color-scheme quirks. Pin it explicitly instead
              of trusting inheritance. */}
          <style jsx global>{`
            .lk-chat-form-input {
              color: #fff !important;
              background-color: rgba(255, 255, 255, 0.08) !important;
              caret-color: #fff;
            }
            .lk-chat-form-input::placeholder {
              color: rgba(255, 255, 255, 0.4);
            }
          `}</style>
        </>
      )}

      {moderateOpen && (
        <ModeratePanel roomName={roomName} onClose={() => setModerateOpen(false)} />
      )}

      {prayerFormOpen && !prayerSubmitted && (
        // color-scheme: dark cascades down from [data-lk-theme=default] on
        // LiveKitRoom -- since color-scheme is inherited and SubmitPrayerForm's
        // plain <input>/<textarea> elements set no explicit background, the
        // browser was rendering their native control background dark while
        // the form's own text-navy classes stayed dark, making typed text
        // invisible. Resetting it here restores normal light-mode form
        // control rendering for this subtree only.
        <div style={{ colorScheme: 'normal' }}>
          <SubmitPrayerForm
            onClose={() => setPrayerFormOpen(false)}
            onSuccess={() => {
              setPrayerFormOpen(false)
              setPrayerSubmitted(true)
            }}
          />
        </div>
      )}

      {prayerSubmitted && (
        <div className="fixed inset-x-3 bottom-6 sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2 z-50 flex items-center gap-2 px-4 py-3 rounded-2xl bg-white dark:bg-navy-dark shadow-2xl">
          <HandHeart className="w-4 h-4 text-gold shrink-0" />
          <p className="text-sm font-body text-navy dark:text-cream">Prayer request submitted — thank you.</p>
          <button
            onClick={() => setPrayerSubmitted(false)}
            className="text-xs font-body text-navy/40 dark:text-cream/40 hover:text-navy dark:hover:text-cream ml-2"
          >
            Dismiss
          </button>
        </div>
      )}
    </div>
  )
}

/**
 * Moderator-only. Lightweight chat moderation: revokes/restores a
 * participant's canPublishData permission server-side via LiveKit -- no
 * message history to delete since Chat is peer-to-peer and never persisted,
 * this just silences (or restores) their future messages in real time.
 */
function ModeratePanel({ roomName, onClose }: { roomName: string; onClose: () => void }) {
  const participants = useRemoteParticipants()
  const [muted, setMutedMap] = useState<Record<string, boolean>>({})
  const [busy, setBusy] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function toggle(identity: string) {
    const nextMuted = !muted[identity]
    setBusy(identity)
    setError(null)
    try {
      await moderateParticipant(roomName, identity, nextMuted)
      setMutedMap((m) => ({ ...m, [identity]: nextMuted }))
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setBusy(null)
    }
  }

  return (
    <div className="fixed right-4 bottom-24 z-50 w-72 bg-white dark:bg-navy-dark rounded-2xl border border-navy/8 shadow-2xl p-4">
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-body font-semibold text-navy dark:text-cream">Moderate chat</p>
        <button onClick={onClose} className="text-navy/40 dark:text-cream/40 hover:text-navy dark:hover:text-cream text-xs font-body">
          Close
        </button>
      </div>

      {error && <p className="text-xs font-body text-red-600 mb-2">{error}</p>}

      {participants.length === 0 && (
        <p className="text-xs font-body text-navy/40 dark:text-cream/40">No one else is in this session yet.</p>
      )}

      <ul className="space-y-1.5 max-h-64 overflow-y-auto">
        {participants.map((p) => {
          const isMuted = !!muted[p.identity]
          return (
            <li key={p.identity} className="flex items-center justify-between gap-2">
              <span className="text-sm font-body text-navy dark:text-cream truncate">{p.name || p.identity}</span>
              <button
                disabled={busy === p.identity}
                onClick={() => toggle(p.identity)}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-body font-medium transition-colors disabled:opacity-50 ${
                  isMuted ? 'bg-red-600/10 text-red-600' : 'bg-navy/6 text-navy/60 dark:bg-cream/6 dark:text-cream/60'
                }`}
              >
                {isMuted ? <MicOff className="w-3 h-3" /> : <Mic className="w-3 h-3" />}
                {isMuted ? 'Muted' : 'Mute'}
              </button>
            </li>
          )
        })}
      </ul>
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
