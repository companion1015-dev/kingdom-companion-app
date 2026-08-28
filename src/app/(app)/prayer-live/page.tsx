'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { Radio, Users } from 'lucide-react'
import Navigation from '@/components/layout/Navigation'
import Footer from '@/components/layout/Footer'
import { type RoomSummary, listRooms, getHostStatus, createRoom, startRoom, endRoom } from './lib'

export default function PrayerLivePage() {
  const [rooms, setRooms] = useState<RoomSummary[]>([])
  const [loadError, setLoadError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [isHost, setIsHost] = useState(false)

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

  useEffect(() => {
    getHostStatus().then(setIsHost)
  }, [])

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

        {isHost && <NewRoomForm onCreated={refresh} />}

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
                  {room.is_live ? (
                    <Link
                      href={`/prayer-live/${encodeURIComponent(room.room_name)}`}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-navy hover:bg-navy-light text-white text-sm font-body font-medium transition-colors"
                    >
                      <Users className="w-3.5 h-3.5" /> Watch now
                    </Link>
                  ) : (
                    <Link
                      href={`/prayer-live/${encodeURIComponent(room.room_name)}`}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-navy/15 text-navy/60 dark:text-cream/60 hover:border-navy/30 text-sm font-body font-medium transition-colors"
                    >
                      Past recordings
                    </Link>
                  )}

                  {isHost && (
                    <HostControls
                      roomName={room.room_name}
                      isLive={room.is_live}
                      onChanged={refresh}
                    />
                  )}
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

function NewRoomForm({ onCreated }: { onCreated: () => void }) {
  const [open, setOpen] = useState(false)
  const [roomName, setRoomName] = useState('')
  const [title, setTitle] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      await createRoom(roomName.trim(), title.trim())
      setRoomName('')
      setTitle('')
      setOpen(false)
      onCreated()
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <details className="group mb-6" open={open} onToggle={(e) => setOpen(e.currentTarget.open)}>
      <summary className="text-xs font-body text-navy/35 dark:text-cream/35 cursor-pointer select-none hover:text-navy/60 dark:hover:text-cream/60 transition-colors list-none">
        Schedule a room
      </summary>
      <form onSubmit={handleSubmit} className="mt-3 flex flex-col gap-2 bg-white dark:bg-navy-dark rounded-2xl border border-navy/8 p-4 sm:p-5">
        {error && <span className="text-red-600 text-xs font-body">{error}</span>}
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Title (e.g. Sunday Evening Prayer)"
          required
          maxLength={255}
          className="px-3.5 py-2 rounded-xl border border-navy/15 bg-transparent text-sm font-body text-navy dark:text-cream placeholder:text-navy/30 dark:placeholder:text-cream/30 focus:outline-none focus:border-gold"
        />
        <input
          value={roomName}
          onChange={(e) => setRoomName(e.target.value)}
          placeholder="Room identifier (e.g. sunday-evening)"
          required
          maxLength={100}
          pattern="[a-zA-Z0-9\-_]+"
          className="px-3.5 py-2 rounded-xl border border-navy/15 bg-transparent text-sm font-body text-navy dark:text-cream placeholder:text-navy/30 dark:placeholder:text-cream/30 focus:outline-none focus:border-gold"
        />
        <button
          type="submit"
          disabled={busy}
          className="self-start px-3.5 py-1.5 rounded-full bg-gold hover:bg-gold-light text-navy text-xs font-body font-semibold transition-colors disabled:opacity-60"
        >
          {busy ? 'Scheduling…' : 'Schedule room'}
        </button>
      </form>
    </details>
  )
}

function HostControls({
  roomName,
  isLive,
  onChanged,
}: {
  roomName: string
  isLive: boolean
  onChanged: () => void
}) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [record, setRecord] = useState(false)

  async function handleStart() {
    setBusy(true)
    setError(null)
    try {
      const recordingError = await startRoom(roomName, record)
      if (recordingError) setError(`Live, but recording failed to start: ${recordingError}`)
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
          <>
            <label className="flex items-center gap-1.5 text-xs font-body text-navy/50 dark:text-cream/50 cursor-pointer">
              <input
                type="checkbox"
                checked={record}
                onChange={(e) => setRecord(e.target.checked)}
                className="rounded"
              />
              Record this session
            </label>
            <button
              disabled={busy}
              onClick={handleStart}
              className="px-3.5 py-1.5 rounded-full bg-gold hover:bg-gold-light text-navy text-xs font-body font-semibold transition-colors disabled:opacity-60"
            >
              {busy ? 'Starting…' : 'Go live'}
            </button>
          </>
        ) : (
          <button
            disabled={busy}
            onClick={handleEnd}
            className="px-3.5 py-1.5 rounded-full bg-red-600 hover:bg-red-700 text-white text-xs font-body font-semibold transition-colors disabled:opacity-60"
          >
            {busy ? 'Ending…' : 'End session'}
          </button>
        )}
      </div>
    </details>
  )
}
