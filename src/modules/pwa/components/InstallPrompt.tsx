'use client'
import { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import { X, Download, Share, Plus } from 'lucide-react'

const DISMISSED_KEY  = 'bc_install_dismissed_at'
const INSTALLED_KEY  = 'bc_installed'
const VISIT_KEY      = 'bc_visit_count'
const DISMISS_COOLDOWN_MS = 30 * 24 * 60 * 60 * 1000 // 30 days

type Platform = 'ios' | 'android-chrome' | 'desktop' | null

function detectPlatform(): Platform {
  if (typeof navigator === 'undefined') return null
  const ua  = navigator.userAgent
  const ios = /iPad|iPhone|iPod/.test(ua)
  if (ios) return 'ios'
  if (/Android/.test(ua) && /Chrome/.test(ua)) return 'android-chrome'
  return 'desktop'
}

function isStandalone(): boolean {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as { standalone?: boolean }).standalone === true
}

export default function InstallPrompt() {
  const [platform,     setPlatform]     = useState<Platform>(null)
  const [deferredEvt,  setDeferredEvt]  = useState<Event | null>(null)
  const [showPrompt,   setShowPrompt]   = useState(false)
  const [showIOSGuide, setShowIOSGuide] = useState(false)
  const [installed,    setInstalled]    = useState(false)
  const [dismissed,    setDismissed]    = useState(false)

  useEffect(() => {
    // Don't show if already installed
    if (isStandalone() || localStorage.getItem(INSTALLED_KEY)) {
      setInstalled(true); return
    }

    // Track visit count
    const visits = parseInt(localStorage.getItem(VISIT_KEY) ?? '0') + 1
    localStorage.setItem(VISIT_KEY, String(visits))

    // Don't show on first visit — wait for second visit or meaningful engagement
    if (visits < 2) return

    // Check dismissal cooldown
    const dismissedAt = localStorage.getItem(DISMISSED_KEY)
    if (dismissedAt && Date.now() - parseInt(dismissedAt) < DISMISS_COOLDOWN_MS) {
      setDismissed(true); return
    }

    const plt = detectPlatform()
    setPlatform(plt)

    // Capture beforeinstallprompt for Android/Desktop
    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredEvt(e)
      // Show after a short delay to not interrupt initial load
      setTimeout(() => setShowPrompt(true), 3000)
    }
    window.addEventListener('beforeinstallprompt', handler)

    // For iOS — show custom guide after delay
    if (plt === 'ios') {
      setTimeout(() => setShowPrompt(true), 3000)
    }

    // Listen for successful installation
    window.addEventListener('appinstalled', () => {
      localStorage.setItem(INSTALLED_KEY, '1')
      setInstalled(true)
      setShowPrompt(false)
    })

    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const handleInstall = useCallback(async () => {
    if (platform === 'ios') {
      setShowIOSGuide(true)
      return
    }
    if (!deferredEvt) return
    const promptEvent = deferredEvt as unknown as { prompt: () => void; userChoice: Promise<{ outcome: string }> }
    promptEvent.prompt()
    const { outcome } = await promptEvent.userChoice
    if (outcome === 'accepted') {
      localStorage.setItem(INSTALLED_KEY, '1')
      setInstalled(true)
    }
    setShowPrompt(false)
  }, [platform, deferredEvt])

  const handleDismiss = () => {
    localStorage.setItem(DISMISSED_KEY, String(Date.now()))
    setShowPrompt(false)
    setDismissed(true)
  }

  if (!showPrompt || installed || dismissed) return null

  const benefits = [
    { icon: '⚡', text: 'Faster launch' },
    { icon: '📖', text: 'Offline Bible reading' },
    { icon: '📅', text: 'Daily devotional access' },
    { icon: '🏠', text: 'Home screen icon' },
    { icon: '🖥️', text: 'Full-screen experience' },
    { icon: '🚀', text: 'Better performance' },
  ]

  // iOS installation guide
  if (showIOSGuide) {
    return (
      <>
        <div className="fixed inset-0 z-40 bg-navy/40 backdrop-blur-sm" onClick={() => setShowIOSGuide(false)} />
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-navy-dark rounded-t-3xl shadow-2xl shadow-navy/30 p-6 pb-10 max-h-[85vh] overflow-y-auto">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-display text-xl font-semibold text-navy dark:text-cream">Install on iPhone</h2>
            <button onClick={() => setShowIOSGuide(false)} className="p-2 text-charcoal/40 dark:text-cream/40 hover:text-navy dark:text-cream rounded-lg"><X className="w-5 h-5" /></button>
          </div>
          <p className="text-sm text-charcoal/55 dark:text-cream/55 font-body mb-6">Follow these steps to add Kingdom Companion to your Home Screen:</p>
          {[
            { step: 1, icon: <Share className="w-5 h-5 text-blue-500" />, title: 'Tap the Share button', desc: 'Find the Share icon (□↑) at the bottom of Safari' },
            { step: 2, icon: <Plus className="w-5 h-5 text-navy dark:text-cream" />,      title: 'Tap "Add to Home Screen"', desc: 'Scroll down in the share menu to find this option' },
            { step: 3, icon: <Download className="w-5 h-5 text-gold" />,  title: 'Tap "Add"', desc: 'Confirm and the app will appear on your Home Screen' },
          ].map(s => (
            <div key={s.step} className="flex gap-4 mb-5">
              <div className="w-9 h-9 rounded-full bg-navy/8 flex items-center justify-center shrink-0">{s.icon}</div>
              <div>
                <p className="text-sm font-body font-semibold text-navy dark:text-cream mb-0.5">{s.title}</p>
                <p className="text-xs font-body text-charcoal/50 dark:text-cream/50">{s.desc}</p>
              </div>
            </div>
          ))}
          <button onClick={() => setShowIOSGuide(false)} className="w-full py-3.5 bg-navy text-white text-sm font-body font-medium rounded-2xl">
            Got it — I&rsquo;ll do it now
          </button>
        </div>
      </>
    )
  }

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40 bg-navy/20 backdrop-blur-sm" onClick={handleDismiss} />

      {/* Install prompt card — bottom sheet on mobile, centred modal on desktop */}
      <div className="fixed bottom-0 left-0 right-0 sm:bottom-auto sm:top-1/2 sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:max-w-md sm:w-full z-50 bg-white dark:bg-navy-dark rounded-t-3xl sm:rounded-3xl shadow-2xl shadow-navy/25 overflow-hidden">

        {/* Header */}
        <div className="relative bg-hero-gradient p-6 text-center">
          <button onClick={handleDismiss} className="absolute top-4 right-4 p-2 text-white/50 hover:text-white rounded-lg transition-colors" aria-label="Dismiss">
            <X className="w-4 h-4" />
          </button>
          <div className="relative w-16 h-16 rounded-2xl overflow-hidden mx-auto mb-3 shadow-lg">
            <Image src="/images/logo.png" alt="Kingdom Companion" fill className="object-cover" sizes="64px" />
          </div>
          <h2 className="font-display text-xl font-semibold text-white mb-1">Install Kingdom Companion</h2>
          <p className="text-white/60 font-body text-xs">Scripture · Encouragement · Peace · Purpose</p>
        </div>

        {/* Body */}
        <div className="p-6">
          <p className="text-sm font-body text-charcoal/60 dark:text-cream/60 text-center mb-5 leading-relaxed">
            Install Kingdom Companion for faster access, offline Bible reading, and a more app-like experience.
          </p>

          {/* Benefits grid */}
          <div className="grid grid-cols-2 gap-2 mb-6">
            {benefits.map(b => (
              <div key={b.text} className="flex items-center gap-2 p-2.5 bg-navy/4 rounded-xl">
                <span className="text-base">{b.icon}</span>
                <span className="text-xs font-body text-navy/70 dark:text-cream/70 font-medium">{b.text}</span>
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-3">
            <button
              onClick={handleInstall}
              className="w-full flex items-center justify-center gap-2 py-4 bg-navy hover:bg-navy-light text-white text-sm font-body font-semibold rounded-2xl transition-all hover:scale-[1.01] shadow-lg shadow-navy/20"
            >
              <Download className="w-4 h-4" />
              Install Now — It&rsquo;s Free
            </button>
            <button
              onClick={handleDismiss}
              className="w-full py-3 text-charcoal/45 dark:text-cream/45 text-sm font-body hover:text-charcoal/70 dark:text-cream/70 transition-colors"
            >
              Maybe Later
            </button>
          </div>

          <p className="text-center text-xs text-charcoal/30 dark:text-cream/30 font-body mt-3">
            Always free &nbsp;·&nbsp; No account required &nbsp;·&nbsp; No advertisements
          </p>
        </div>
      </div>
    </>
  )
}