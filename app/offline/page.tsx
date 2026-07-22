'use client'
import { useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { WifiOff, RefreshCw, BookOpen, Bookmark, FileText, Calendar } from 'lucide-react'

export default function OfflinePage() {
  // Auto-redirect when connection restored
  useEffect(() => {
    const handler = () => { window.location.href = '/' }
    window.addEventListener('online', handler)
    return () => window.removeEventListener('online', handler)
  }, [])

  const handleRetry = () => {
    if (navigator.onLine) window.location.href = '/'
    else {
      const btn = document.getElementById('retry-btn')
      if (btn) { btn.textContent = 'Still offline — try again shortly'; setTimeout(() => { btn.textContent = 'Retry Connection' }, 3000) }
    }
  }

  const available = [
    { icon: BookOpen,  label: 'Bible Reading',  desc: 'Previously viewed chapters' },
    { icon: Calendar,  label: 'Devotionals',    desc: 'Cached content'             },
    { icon: Bookmark,  label: 'Bookmarks',      desc: 'Your saved verses'          },
    { icon: FileText,  label: 'Notes',          desc: 'Syncs when reconnected'     },
  ]

  return (
    <div className="min-h-screen bg-cream flex items-center justify-center p-6">
      <div className="bg-white rounded-3xl border border-navy/8 shadow-xl shadow-navy/8 max-w-md w-full overflow-hidden">

        {/* Header */}
        <div className="bg-hero-gradient p-8 text-center relative overflow-hidden">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full opacity-[0.06]"
            style={{ background: 'radial-gradient(circle, #C9A84C 0%, transparent 70%)' }}
          />
          <div className="relative w-16 h-16 rounded-2xl overflow-hidden mx-auto mb-4 shadow-lg">
            <Image src="/images/logo.png" alt="Kingdom Companion" fill className="object-cover" sizes="64px" />
          </div>
          <div className="flex items-center justify-center gap-2 mb-3">
            <div className="w-2 h-2 rounded-full bg-amber-400" />
            <span className="text-xs font-body font-semibold text-amber-300 tracking-widest uppercase">Offline Mode</span>
          </div>
          <WifiOff className="w-10 h-10 text-white/30 mx-auto mb-3" />
          <h1 className="font-display text-2xl font-light text-white mb-2">You&rsquo;re Offline</h1>
          <p className="text-white/55 font-body text-sm leading-relaxed">
            No internet connection detected. You can still access content that has already been downloaded.
          </p>
        </div>

        {/* Body */}
        <div className="p-6">

          {/* Scripture verse */}
          <div className="p-4 rounded-2xl bg-cream border-l-4 border-gold mb-6">
            <p className="font-display italic text-navy text-base leading-relaxed mb-2">
              &ldquo;Your word is a lamp to my feet and a light to my path.&rdquo;
            </p>
            <p className="text-gold text-xs font-body font-semibold">— Psalm 119:105 (NIV)</p>
          </div>

          {/* Available features */}
          <p className="text-xs font-body font-semibold text-navy/40 tracking-widest uppercase mb-3">
            Available Offline
          </p>
          <div className="grid grid-cols-2 gap-2 mb-5">
            {available.map(({ icon: Icon, label, desc }) => (
              <div key={label} className="flex items-start gap-2.5 p-3 rounded-xl bg-navy/4">
                <Icon className="w-4 h-4 text-navy/40 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-body font-semibold text-navy/70">{label}</p>
                  <p className="text-xs font-body text-charcoal/40 leading-tight">{desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* AI notice */}
          <div className="flex items-center gap-3 p-3.5 rounded-xl bg-amber-50 border border-amber-100 mb-6">
            <span className="text-xl">💬</span>
            <p className="text-xs font-body text-amber-700 leading-relaxed">
              AI explanations require an internet connection and will return once you&rsquo;re reconnected.
            </p>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-3">
            <button
              id="retry-btn"
              onClick={handleRetry}
              className="w-full flex items-center justify-center gap-2 py-3.5 bg-navy hover:bg-navy-light text-white text-sm font-body font-semibold rounded-2xl transition-all"
            >
              <RefreshCw className="w-4 h-4" />
              Retry Connection
            </button>
            <Link
              href="/bible"
              className="w-full flex items-center justify-center gap-2 py-3.5 border border-navy/15 hover:border-navy/30 text-navy/70 hover:text-navy text-sm font-body font-medium rounded-2xl transition-all"
            >
              <BookOpen className="w-4 h-4" />
              Go to Downloaded Content
            </Link>
          </div>

          <p className="text-center text-xs font-body text-charcoal/25 mt-5">
            Kingdom Companion &nbsp;·&nbsp; Rooted in Truth. Built for Life.
          </p>
        </div>
      </div>
    </div>
  )
}
