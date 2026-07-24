'use client'
import { useState, useEffect } from 'react'
import Image from 'next/image'

type Props = {
  onComplete?: () => void
  isOffline?:  boolean
}

export default function SplashScreen({ onComplete, isOffline = false }: Props) {
  const [phase, setPhase] = useState<'logo' | 'name' | 'tagline' | 'loading' | 'done'>('logo')
  const [progress, setProgress] = useState(0)
  const [message, setMessage] = useState('Preparing your Kingdom Companion…')

  useEffect(() => {
    // Animation sequence: logo → name → tagline → loading → done
    const timings = [
      { phase: 'name'    as const, delay: 400  },
      { phase: 'tagline' as const, delay: 800  },
      { phase: 'loading' as const, delay: 1200 },
      { phase: 'done'    as const, delay: 2200 },
    ]

    const timers = timings.map(({ phase, delay }) =>
      setTimeout(() => setPhase(phase), delay)
    )

    // Progress bar animation
    const progressInterval = setInterval(() => {
      setProgress(p => {
        if (p >= 100) { clearInterval(progressInterval); return 100 }
        return p + 4
      })
    }, 60)

    // Loading messages
    const messages = [
      'Preparing your Kingdom Companion…',
      'Loading Scripture…',
      'Setting up your experience…',
    ]
    let msgIdx = 0
    const msgInterval = setInterval(() => {
      msgIdx = (msgIdx + 1) % messages.length
      setMessage(messages[msgIdx])
    }, 900)

    // Complete
    const doneTimer = setTimeout(() => {
      onComplete?.()
    }, 2400)

    return () => {
      timers.forEach(clearTimeout)
      clearTimeout(doneTimer)
      clearInterval(progressInterval)
      clearInterval(msgInterval)
    }
  }, [onComplete])

  // If loading takes too long
  const [slowLoad, setSlowLoad] = useState(false)
  useEffect(() => {
    const t = setTimeout(() => setSlowLoad(true), 4000)
    return () => clearTimeout(t)
  }, [])

  return (
    <div
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center"
      style={{
        background: 'linear-gradient(160deg, #1B3A5C 0%, #2A5080 40%, #1a3850 70%, #0f2236 100%)',
      }}
      role="status"
      aria-label="Loading Kingdom Companion"
      aria-live="polite"
    >
      {/* Background glow */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(201,168,76,0.08) 0%, transparent 70%)' }}
        aria-hidden="true"
      />

      {/* Main content */}
      <div className="relative z-10 flex flex-col items-center px-8 text-center max-w-sm">

        {/* Logo — fades in first */}
        <div
          className="mb-6 transition-all duration-700"
          style={{
            opacity: phase === 'logo' ? 0 : 1,
            transform: phase === 'logo' ? 'scale(0.85) translateY(8px)' : 'scale(1) translateY(0)',
          }}
        >
          <div
            className="relative w-28 h-28 rounded-3xl overflow-hidden shadow-2xl"
            style={{ boxShadow: '0 0 60px rgba(201,168,76,0.25), 0 20px 60px rgba(0,0,0,0.4)' }}
          >
            <Image
              src="/images/logo.png"
              alt="Kingdom Companion"
              fill
              className="object-cover"
              sizes="112px"
              priority
            />
          </div>
        </div>

        {/* App name */}
        <div
          className="mb-2 transition-all duration-600"
          style={{
            opacity: ['logo', 'name'].includes(phase) && phase !== 'name' ? 0 : phase === 'logo' ? 0 : 1,
            transform: phase === 'logo' ? 'translateY(12px)' : 'translateY(0)',
          }}
        >
          <p
            className="text-xs tracking-[0.25em] uppercase mb-2"
            style={{ color: 'rgba(201,168,76,0.7)', fontFamily: 'Inter, sans-serif', fontWeight: 500 }}
          >
            The
          </p>
          <h1
            style={{ fontFamily: '"Cormorant Garamond", Georgia, serif', fontSize: '38px', fontWeight: 300, color: '#ffffff', lineHeight: 1.1, letterSpacing: '0.02em' }}
          >
            Kingdom Companion
          </h1>
        </div>

        {/* Tagline */}
        <p
          className="transition-all duration-500"
          style={{
            opacity: ['logo', 'name'].includes(phase) ? 0 : 1,
            transform: ['logo', 'name'].includes(phase) ? 'translateY(8px)' : 'translateY(0)',
            fontFamily: 'Inter, sans-serif',
            fontSize: '12px',
            color: 'rgba(255,255,255,0.45)',
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            marginTop: '8px',
            marginBottom: '48px',
          }}
        >
          Scripture · Encouragement · Peace · Purpose
        </p>

        {/* Progress bar */}
        <div
          className="w-full transition-all duration-500"
          style={{ opacity: phase === 'loading' || phase === 'done' ? 1 : 0 }}
        >
          <div
            className="w-full rounded-full overflow-hidden mb-3"
            style={{ height: '2px', background: 'rgba(255,255,255,0.08)' }}
          >
            <div
              className="h-full rounded-full transition-all duration-150"
              style={{
                width:      `${progress}%`,
                background: 'linear-gradient(90deg, #C9A84C, #E8CC7A)',
              }}
            />
          </div>
          <p
            style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', color: 'rgba(255,255,255,0.3)' }}
          >
            {slowLoad && isOffline
              ? 'Loading offline content…'
              : slowLoad
              ? 'This is taking longer than usual…'
              : message
            }
          </p>
        </div>

        {/* Offline notice */}
        {isOffline && (
          <div
            className="mt-6 px-4 py-2.5 rounded-xl"
            style={{
              background: 'rgba(201,168,76,0.1)',
              border:     '1px solid rgba(201,168,76,0.2)',
              fontFamily: 'Inter, sans-serif',
              fontSize:   '11px',
              color:      'rgba(201,168,76,0.8)',
            }}
          >
            Offline — loading cached content
          </div>
        )}
      </div>

      {/* Version + copyright — bottom */}
      <div
        className="absolute bottom-8 left-0 right-0 text-center"
        style={{ fontFamily: 'Inter, sans-serif', fontSize: '10px', color: 'rgba(255,255,255,0.2)' }}
      >
        <p>v1.0.0 &nbsp;·&nbsp; © Kingdom Companion &nbsp;·&nbsp; Rooted in Truth. Built for Life.</p>
      </div>
    </div>
  )
}