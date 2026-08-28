'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import Navigation from '@/components/layout/Navigation'
import Footer from '@/components/layout/Footer'
import { type RoomSummary, listRooms } from '../lib'

const PrayerLiveSession = dynamic(() => import('../PrayerLiveSession'), {
  ssr: false,
  loading: () => (
    <div className="flex flex-col items-center justify-center h-screen bg-navy gap-3">
      <div className="w-6 h-6 border-2 border-white/20 border-t-gold rounded-full animate-spin" />
    </div>
  ),
})

export default function PrayerLiveRoomPage() {
  const params = useParams<{ roomName: string }>()
  const router = useRouter()
  const roomName = decodeURIComponent(params.roomName)

  const [room, setRoom] = useState<RoomSummary | null>(null)
  const [notFound, setNotFound] = useState(false)
  const [loading, setLoading] = useState(true)
  const [joined, setJoined] = useState(false)

  const refresh = useCallback(() => {
    listRooms()
      .then((rooms) => {
        const match = rooms.find((r) => r.room_name === roomName)
        setRoom(match ?? null)
        setNotFound(!match)
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false))
  }, [roomName])

  useEffect(() => {
    refresh()
    const interval = setInterval(refresh, 5000)
    return () => clearInterval(interval)
  }, [refresh])

  if (joined && room?.is_live) {
    return (
      <PrayerLiveSession
        roomName={room.room_name}
        title={room.title}
        onLeave={() => {
          setJoined(false)
          router.push('/prayer-live')
        }}
      />
    )
  }

  return (
    <div className="min-h-screen bg-cream dark:bg-navy-dark-gradient">
      <Navigation />

      <main className="max-w-md mx-auto px-4 sm:px-6 pt-28 pb-16 text-center">
        <Link
          href="/prayer-live"
          className="inline-flex items-center gap-1.5 text-xs font-body text-navy/40 dark:text-cream/40 hover:text-navy/70 dark:hover:text-cream/70 transition-colors mb-8"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> All live prayer sessions
        </Link>

        {loading && (
          <div className="h-32 rounded-2xl bg-navy/6 dark:bg-cream/6 animate-pulse" />
        )}

        {!loading && notFound && (
          <>
            <h1 className="font-display text-2xl font-light text-navy dark:text-cream mb-2">Session not found</h1>
            <p className="text-navy/60 dark:text-cream/60 font-body text-sm">
              This prayer session doesn't exist or has been removed.
            </p>
          </>
        )}

        {!loading && room && !room.is_live && (
          <>
            <h1 className="font-display text-2xl font-light text-navy dark:text-cream mb-2">{room.title}</h1>
            <p className="text-navy/60 dark:text-cream/60 font-body text-sm">
              This session isn't live right now — this page will update automatically when it starts.
            </p>
          </>
        )}

        {!loading && room && room.is_live && (
          <>
            <h1 className="font-display text-2xl font-light text-navy dark:text-cream mb-2">{room.title}</h1>
            <p className="text-navy/60 dark:text-cream/60 font-body text-sm mb-6">
              This session is live now. Watch freely without an account, or sign in to join the conversation.
            </p>
            <button
              onClick={() => setJoined(true)}
              className="px-5 py-2 rounded-full bg-gold hover:bg-gold-light text-navy text-sm font-body font-semibold transition-colors"
            >
              Join session
            </button>
          </>
        )}
      </main>

      <Footer />
    </div>
  )
}
