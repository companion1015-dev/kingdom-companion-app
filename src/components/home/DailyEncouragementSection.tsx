'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowRight, Sunrise } from 'lucide-react'

// Real fix: this previously always showed one single hardcoded entry from
// mock.ts, regardless of the actual date. Now fetches from /api/v1/daily,
// which generates genuinely fresh content once per calendar day via Claude
// (with real Scripture text fetched separately, never AI-fabricated) and
// caches it -- true daily variation, not a static mock.

type DailyEntry = {
  date?: string
  verse_reference: string
  verse_text: string
  translation: string
  title: string
  reflection: string
  prayer: string
  challenge: string
}

export default function DailyEncouragementSection() {
  const [entry,   setEntry]   = useState<DailyEntry | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/v1/daily')
      .then(r => r.json())
      .then(res => { if (res.success) setEntry(res.data) })
      .catch(() => { /* card just won't render below -- not critical to page load */ })
      .finally(() => setLoading(false))
  }, [])

  const todayLabel = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })

  return (
    <section
      className="py-20 px-4 sm:px-6 lg:px-8 bg-navy"
      aria-labelledby="daily-heading"
    >
      <div className="max-w-4xl mx-auto">

        {/* Section label */}
        <div className="flex items-center gap-3 mb-8">
          <div className="flex items-center gap-2 text-gold/80">
            <Sunrise className="w-4 h-4" />
            <span className="text-xs font-body font-medium tracking-widest uppercase">Daily Encouragement</span>
          </div>
          <div className="flex-1 h-px bg-white/10 dark:bg-navy-dark" />
          <span className="text-xs text-white/30 font-body">{todayLabel}</span>
        </div>

        {/* Main card */}
        <div
          className="rounded-2xl p-8 sm:p-10 relative overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, rgba(201,168,76,0.08) 0%, rgba(27,58,92,0.6) 100%)',
            border: '1px solid rgba(201,168,76,0.15)',
          }}
        >
          {/* Decorative quote mark */}
          <span
            className="absolute top-6 right-8 font-display text-[120px] leading-none text-white/03 select-none pointer-events-none"
            aria-hidden="true"
          >
            &rdquo;
          </span>

          {loading && (
            <div className="animate-pulse space-y-4">
              <div className="h-8 w-3/4 bg-white/10 dark:bg-navy-dark rounded" />
              <div className="h-4 w-1/3 bg-white/10 dark:bg-navy-dark rounded" />
              <div className="h-px bg-white/10 dark:bg-navy-dark my-6" />
              <div className="h-4 w-full bg-white/8 dark:bg-navy-dark rounded" />
              <div className="h-4 w-5/6 bg-white/8 dark:bg-navy-dark rounded" />
            </div>
          )}

          {!loading && entry && (
            <>
              {/* Verse */}
              <div className="mb-7">
                <p className="font-display text-2xl sm:text-3xl font-light text-white leading-relaxed italic mb-3">
                  &ldquo;{entry.verse_text}&rdquo;
                </p>
                <p className="text-gold text-sm font-body font-medium">
                  — {entry.verse_reference} <span className="text-white/30">({entry.translation})</span>
                </p>
              </div>

              {/* Divider */}
              <div className="h-px bg-gradient-to-r from-transparent via-gold/20 to-transparent mb-7" />

              {/* Reflection */}
              <p className="text-white/65 font-body text-base leading-relaxed mb-4">
                {entry.reflection}
              </p>

              {/* Prayer snippet */}
              <p className="text-white/45 font-display italic text-sm leading-relaxed mb-7 pl-4 border-l-2 border-gold/30">
                {entry.prayer}
              </p>

              {/* Challenge */}
              <div className="flex items-start gap-3 p-4 rounded-xl bg-white/5 dark:bg-navy-dark border border-white/8 mb-8">
                <span className="text-base mt-0.5">📖</span>
                <div>
                  <span className="text-xs text-gold/70 font-body font-medium tracking-wider uppercase block mb-1">Today&rsquo;s Challenge</span>
                  <p className="text-white/70 text-sm font-body">{entry.challenge}</p>
                </div>
              </div>

              {/* CTA */}
              <Link
                href="/daily"
                className="inline-flex items-center gap-2 text-gold hover:text-gold-light font-body text-sm font-medium transition-colors group"
              >
                Read today&rsquo;s full devotional
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </>
          )}

          {!loading && !entry && (
            <p className="text-white/50 font-body text-sm">Today&rsquo;s encouragement couldn&rsquo;t be loaded right now.</p>
          )}
        </div>
      </div>
    </section>
  )
}
