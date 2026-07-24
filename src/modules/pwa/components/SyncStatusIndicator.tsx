'use client'
import { useState, useEffect } from 'react'
import { Wifi, WifiOff, RefreshCw, Check, AlertCircle } from 'lucide-react'
import { initConnectionMonitoring, getPendingCount, onSyncStatusChange } from '@/lib/pwa/background-sync'
import type { SyncStatus } from '@/lib/pwa/background-sync'

export default function SyncStatusIndicator() {
  const [status,  setStatus]  = useState<SyncStatus>('idle')
  const [pending, setPending] = useState(0)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    // Fix Error 5: use static import instead of dynamic require()
    const cleanupMonitoring = initConnectionMonitoring()
    const unsubscribe = onSyncStatusChange((s: SyncStatus) => {
      setStatus(s)
      setVisible(s !== 'idle')
      if (s === 'idle') {
        setTimeout(() => setVisible(false), 3000)
      }
    })

    const interval = setInterval(async () => {
      try {
        const count = await getPendingCount()
        setPending(count)
      } catch { /* ignore */ }
    }, 5000)

    return () => {
      cleanupMonitoring()
      unsubscribe()
      clearInterval(interval)
    }
  }, [])

  if (!visible) return null

  const configs: Record<SyncStatus, {
    icon: typeof Wifi
    label: string
    bg:   string
    text: string
  }> = {
    idle:    { icon: Check,       label: 'All changes synced',                                            bg: 'bg-green-50 border-green-200', text: 'text-green-700' },
    syncing: { icon: RefreshCw,   label: 'Synchronising…',                                               bg: 'bg-blue-50 border-blue-200',   text: 'text-blue-700'  },
    offline: { icon: WifiOff,     label: `Offline Mode${pending > 0 ? ` · ${pending} changes queued` : ''}`, bg: 'bg-amber-50 border-amber-200', text: 'text-amber-700' },
    error:   { icon: AlertCircle, label: 'Sync failed – will retry',                                     bg: 'bg-red-50 border-red-200',     text: 'text-red-700'   },
  }

  const cfg  = configs[status]
  const Icon = cfg.icon

  return (
    <div
      className={`fixed bottom-24 left-1/2 -translate-x-1/2 z-40 flex items-center gap-2 px-4 py-2 rounded-full border text-xs font-body font-medium shadow-md animate-fade-in ${cfg.bg} ${cfg.text}`}
      role="status"
      aria-live="polite"
      aria-label={cfg.label}
    >
      <Icon className={`w-3.5 h-3.5 ${status === 'syncing' ? 'animate-spin' : ''}`} />
      <span>{cfg.label}</span>
    </div>
  )
}