'use client'
import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'

// Dynamically import PWA components (client-only)
const SplashScreen     = dynamic(() => import('@/modules/pwa/components/SplashScreen'),     { ssr: false })
const InstallPrompt    = dynamic(() => import('@/modules/pwa/components/InstallPrompt'),    { ssr: false })
const DailyDevotionalPopup = dynamic(() => import('@/modules/pwa/components/DailyDevotionalPopup'), { ssr: false })
const SyncStatusIndicator = dynamic(() => import('@/modules/pwa/components/SyncStatusIndicator'), { ssr: false })

type Props = { children: React.ReactNode }

export default function PWAProvider({ children }: Props) {
  const [splashDone, setSplashDone] = useState(false)
  const [isOffline,  setIsOffline]  = useState(false)
  const [showSplash, setShowSplash] = useState(false)

  // Real bug found investigating "install doesn't work on mobile": this app
  // never actually registered its own service worker. @ducanh2912/next-pwa
  // builds a real, valid public/sw.js and injects `register: true` by
  // default, but that auto-injection targets the Pages Router's
  // _document.js -- this project is App Router only (src/app), so nothing
  // ever called navigator.serviceWorker.register() and no SW was ever
  // active. Confirmed via Chrome DevTools Protocol: manifest and
  // installability checks both passed with zero errors, but
  // `navigator.serviceWorker.getRegistration()` returned nothing -- a
  // controlling service worker is required before Chrome will ever fire
  // beforeinstallprompt, which is why "Install App" always fell through to
  // the manual-instructions guide. Registering it directly, here, fixes
  // that at the source rather than working around the symptom.
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js', { scope: '/' })
        .catch(err => console.error('[PWA] Service worker registration failed:', err))
    }
  }, [])

  useEffect(() => {
    // Only show splash on first load / PWA launch
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as { standalone?: boolean }).standalone === true
    const isFirstVisit = !sessionStorage.getItem('bc_splash_shown')

    // Show splash for PWA installs and first visit
    if (isStandalone || isFirstVisit) {
      setShowSplash(true)
      sessionStorage.setItem('bc_splash_shown', '1')
    } else {
      setSplashDone(true)
    }

    setIsOffline(!navigator.onLine)

    const onOnline  = () => setIsOffline(false)
    const onOffline = () => setIsOffline(true)
    window.addEventListener('online',  onOnline)
    window.addEventListener('offline', onOffline)
    return () => {
      window.removeEventListener('online',  onOnline)
      window.removeEventListener('offline', onOffline)
    }
  }, [])

  return (
    <>
      {/* Splash screen — shown on first load and PWA launch */}
      {showSplash && !splashDone && (
        <SplashScreen
          onComplete={() => setSplashDone(true)}
          isOffline={isOffline}
        />
      )}

      {/* Main app — always rendered but hidden under splash */}
      <div style={{ visibility: (showSplash && !splashDone) ? 'hidden' : 'visible' }}>
        {children}
      </div>

      {/* PWA install prompt — non-intrusive, timing controlled */}
      {splashDone && <InstallPrompt />}

      {/* Daily devotional reminder — once per calendar day, for every visitor */}
      {splashDone && <DailyDevotionalPopup />}

      {/* Sync status indicator — offline/syncing/synced */}
      {splashDone && <SyncStatusIndicator />}
    </>
  )
}