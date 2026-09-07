'use client'
import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { X, Sunrise, ArrowRight } from 'lucide-react'
import { localDateKey } from '@/lib/date'

// Daily pop-up reminder shown once per calendar day to every visitor (signed
// in or not) so the Daily Encouragement isn't something people have to
// remember to go look for. Content is the same real, per-date-generated
// entry served by /api/v1/daily (Claude-written reflection + real Scripture
// text from the Bible API) -- never a static/mocked message.

const SHOWN_KEY = 'kc_daily_popup_shown_date'

type DailyEntry = {
  verse_reference: string
  verse_text: string
  title: string
}

export default function DailyDevotionalPopup() {
  const [entry,        setEntry]        = useState<DailyEntry | null>(null)
  const [visible,       setVisible]      = useState(false)
  const [installOpen,   setInstallOpen]  = useState(false)

  useEffect(() => {
    const onOverlayChange = (e: Event) => {
      const detail = (e as CustomEvent<{ id: string; open: boolean }>).detail
      if (detail?.id === 'install-prompt') setInstallOpen(!!detail.open)
    }
    window.addEventListener('kc:overlay-change', onOverlayChange)
    return () => window.removeEventListener('kc:overlay-change', onOverlayChange)
  }, [])

  useEffect(() => {
    const today = localDateKey()
    let alreadyShownToday = false
    try {
      alreadyShownToday = localStorage.getItem(SHOWN_KEY) === today
    } catch { /* private browsing / storage blocked -- fall back to showing */ }
    if (alreadyShownToday) return

    let cancelled = false
    fetch(`/api/v1/daily?local_date=${today}`)
      .then(r => r.json())
      .then(res => { if (!cancelled && res.success) setEntry(res.data) })
      .catch(() => { /* no popup if today's content can't be fetched */ })

    return () => { cancelled = true }
  }, [])

  // Wait for the install prompt (if any) to clear before showing, so the two
  // overlays never stack on top of each other.
  useEffect(() => {
    if (!entry || installOpen) return
    const today = localDateKey()
    try {
      if (localStorage.getItem(SHOWN_KEY) === today) return
    } catch { /* proceed without persistence */ }

    const t = setTimeout(() => {
      setVisible(true)
      try { localStorage.setItem(SHOWN_KEY, today) } catch { /* non-fatal */ }
    }, 2500)
    return () => clearTimeout(t)
  }, [entry, installOpen])

  const dismiss = useCallback(() => setVisible(false), [])

  if (!visible || !entry) return null

  return (
    <>
      <div className="fixed inset-0 z-40 bg-navy/20 backdrop-blur-sm" onClick={dismiss} />
      <div
        role="dialog"
        aria-labelledby="daily-popup-heading"
        className="fixed bottom-0 left-0 right-0 sm:bottom-6 sm:left-1/2 sm:right-auto sm:-translate-x-1/2 sm:max-w-sm w-full z-50 bg-white dark:bg-navy-dark rounded-t-3xl sm:rounded-3xl shadow-2xl shadow-navy/25 overflow-hidden border border-navy/8"
      >
        <div className="relative bg-hero-gradient px-6 pt-5 pb-4">
          <button onClick={dismiss} className="absolute top-3 right-3 p-1.5 text-white/50 hover:text-white rounded-lg transition-colors" aria-label="Dismiss">
            <X className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-2 text-gold/90 mb-1">
            <Sunrise className="w-4 h-4" />
            <span id="daily-popup-heading" className="text-xs font-body font-medium tracking-widest uppercase">Today&rsquo;s Encouragement</span>
          </div>
          <p className="font-display text-lg text-white leading-snug">{entry.title}</p>
        </div>

        <div className="p-6">
          <p className="font-display italic text-navy dark:text-cream text-sm leading-relaxed mb-1">
            &ldquo;{entry.verse_text.length > 140 ? `${entry.verse_text.slice(0, 140)}…` : entry.verse_text}&rdquo;
          </p>
          <p className="text-gold text-xs font-body font-semibold mb-5">— {entry.verse_reference}</p>

          <div className="flex flex-col gap-2.5">
            <Link
              href="/daily"
              onClick={dismiss}
              className="w-full flex items-center justify-center gap-2 py-3 bg-navy hover:bg-navy-light text-white text-sm font-body font-semibold rounded-2xl transition-all"
            >
              Read Today&rsquo;s Devotional <ArrowRight className="w-4 h-4" />
            </Link>
            <button
              onClick={dismiss}
              className="w-full py-2 text-charcoal/45 dark:text-cream/45 text-xs font-body hover:text-charcoal/70 dark:text-cream/70 transition-colors"
            >
              Maybe later
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
