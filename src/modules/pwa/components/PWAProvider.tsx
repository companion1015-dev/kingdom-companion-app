'use client'
import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'

// Dynamically import PWA components (client-only)
const SplashScreen     = dynamic(() => import('@/modules/pwa/components/SplashScreen'),     { ssr: false })
const InstallPrompt    = dynamic(() => import('@/modules/pwa/components/InstallPrompt'),    { ssr: false })
const SyncStatusIndicator = dynamic(() => import('@/modules/pwa/components/SyncStatusIndicator'), { ssr: false })

type Props = { children: React.ReactNode }

export default function PWAProvider({ children }: Props) {
  const [splashDone, setSplashDone] = useState(false)
  const [isOffline,  setIsOffline]  = useState(false)
  const [showSplash, setShowSplash] = useState(false)

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

      {/* Sync status indicator — offline/syncing/synced */}
      {splashDone && <SyncStatusIndicator />}
    </>
  )
}