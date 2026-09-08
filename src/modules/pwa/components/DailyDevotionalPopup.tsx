'use client'
import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { X, Sunrise, ArrowRight, BellRing, BellOff } from 'lucide-react'
import { localDateKey } from '@/lib/date'

// Daily pop-up reminder shown once per calendar day to every visitor (signed
// in or not) so the Daily Encouragement isn't something people have to
// remember to go look for. Content is the same real, per-date-generated
// entry served by /api/v1/daily (Claude-written reflection + real Scripture
// text from the Bible API) -- never a static/mocked message.
//
// Also offers an opt-in real Web Push subscription, dated to the calendar
// day -- backed by worker/index.js's `push` handler and the
// /api/v1/push/send-daily cron sender, this fires an actual OS-level
// notification even when the app/tab is fully closed (desktop Chrome/
// Firefox/Edge, Android Chrome; iOS needs the app installed to Home
// Screen on iOS 16.4+). Falls back to firing an immediate in-page
// Notification too, purely for instant feedback the moment someone opts
// in -- the real day-to-day delivery comes from the push subscription.
// Hides itself entirely wherever the Notification/Push/ServiceWorker APIs
// aren't supported (e.g. non-installed iOS Safari) rather than promising
// something it can't deliver there.

const SHOWN_KEY  = 'kc_daily_popup_shown_date'
const NOTIFY_KEY = 'kc_daily_notify_enabled'

type DailyEntry = {
  date?: string
  verse_reference: string
  verse_text: string
  title: string
}

function formattedToday(): string {
  return new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
}

function fireDailyNotification(entry: DailyEntry, dateLabel: string) {
  try {
    if (!('Notification' in window) || Notification.permission !== 'granted') return
    const n = new Notification(`Today's Encouragement — ${dateLabel}`, {
      body: `${entry.title}\n"${entry.verse_text.slice(0, 110)}${entry.verse_text.length > 110 ? '…' : ''}" — ${entry.verse_reference}`,
      icon: '/icons/icon-192.png',
      tag: 'kc-daily-devotional',
    })
    n.onclick = () => { window.focus(); window.location.href = '/daily'; n.close() }
  } catch { /* Notification constructor unsupported/blocked on this platform -- no-op */ }
}

// Web Push wants the VAPID public key as a raw Uint8Array, not the
// base64url string it's stored/transmitted as.
function urlBase64ToUint8Array(base64: string): Uint8Array {
  const padding = '='.repeat((4 - (base64.length % 4)) % 4)
  const base64Safe = (base64 + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw = atob(base64Safe)
  const arr = new Uint8Array(raw.length)
  for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i)
  return arr
}

async function subscribeToPush(): Promise<boolean> {
  const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
  if (!vapidPublicKey || !('serviceWorker' in navigator) || !('PushManager' in window)) return false
  try {
    const registration = await navigator.serviceWorker.ready
    let sub = await registration.pushManager.getSubscription()
    if (!sub) {
      sub = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey) as BufferSource,
      })
    }
    const json = sub.toJSON() as { endpoint?: string; keys?: { p256dh?: string; auth?: string } }
    if (!json.endpoint || !json.keys?.p256dh || !json.keys?.auth) return false

    await fetch('/api/v1/push/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        subscription: { endpoint: json.endpoint, keys: { p256dh: json.keys.p256dh, auth: json.keys.auth } },
        timezoneOffsetMinutes: new Date().getTimezoneOffset(),
      }),
    })
    return true
  } catch (e) {
    console.error('[DailyDevotionalPopup] push subscribe failed:', e)
    return false
  }
}

export default function DailyDevotionalPopup() {
  const [entry,          setEntry]          = useState<DailyEntry | null>(null)
  const [visible,         setVisible]        = useState(false)
  const [installOpen,     setInstallOpen]    = useState(false)
  const [notifySupported, setNotifySupported] = useState(false)
  const [notifyEnabled,   setNotifyEnabled]   = useState(false)

  useEffect(() => {
    try {
      const supported = 'Notification' in window && 'serviceWorker' in navigator && 'PushManager' in window
      setNotifySupported(supported)
      setNotifyEnabled(supported && localStorage.getItem(NOTIFY_KEY) === '1' && Notification.permission === 'granted')
    } catch { /* storage/Notification blocked -- leave both false */ }
  }, [])

  useEffect(() => {
    const onOverlayChange = (e: Event) => {
      const detail = (e as CustomEvent<{ id: string; open: boolean }>).detail
      if (detail?.id === 'install-prompt') setInstallOpen(!!detail.open)
    }
    window.addEventListener('kc:overlay-change', onOverlayChange)
    return () => window.removeEventListener('kc:overlay-change', onOverlayChange)
  }, [])

  // The install prompt can also now be opened on demand (the nav bar's
  // "Install App" button), possibly after this popup is already on screen
  // -- close this one so the two never stack.
  useEffect(() => {
    if (installOpen) setVisible(false)
  }, [installOpen])

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
      if (notifyEnabled) fireDailyNotification(entry, formattedToday())
    }, 2500)
    return () => clearTimeout(t)
  }, [entry, installOpen, notifyEnabled])

  const dismiss = useCallback(() => setVisible(false), [])

  const enableReminders = useCallback(async () => {
    try {
      const perm = await Notification.requestPermission()
      if (perm !== 'granted') return

      const subscribed = await subscribeToPush()
      if (!subscribed) return // couldn't register real push -- don't claim reminders are on

      localStorage.setItem(NOTIFY_KEY, '1')
      setNotifyEnabled(true)
      if (entry) fireDailyNotification(entry, formattedToday())
    } catch { /* permission prompt blocked/unsupported -- leave reminders off */ }
  }, [entry])

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
          <p className="text-white/50 font-body text-[11px] mb-2">{formattedToday()}</p>
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

          {notifySupported && (
            <div className="mt-4 pt-4 border-t border-navy/8 text-center">
              {notifyEnabled ? (
                <p className="flex items-center justify-center gap-1.5 text-xs text-navy/40 dark:text-cream/40 font-body">
                  <BellRing className="w-3.5 h-3.5 text-gold" /> Daily reminders are on
                </p>
              ) : (
                <button
                  onClick={enableReminders}
                  className="flex items-center justify-center gap-1.5 mx-auto text-xs text-navy/50 dark:text-cream/50 hover:text-gold font-body font-medium transition-colors"
                >
                  <BellOff className="w-3.5 h-3.5" /> Get a dated reminder each day
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
