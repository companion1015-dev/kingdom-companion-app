'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { BookMarked, Clock } from 'lucide-react'
import Navigation from '@/components/layout/Navigation'
import Footer from '@/components/layout/Footer'

// PRD §4.44 — Devotional Library index. Distinct from /daily (Daily
// Encouragement), which already has its own implementation and is untouched here.

type Series = {
  id: string
  slug: string
  title: string
  category: string
  description: string | null
  duration_days: number
}

export default function DevotionalsPage() {
  const [series,  setSeries]  = useState<Series[]>([])
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/v1/devotionals')
      .then(r => r.json())
      .then(body => {
        if (!body.success) throw new Error()
        setSeries(body.data)
      })
      .catch(() => setError('Something went wrong loading Devotionals. Please try again.'))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="min-h-screen bg-cream-gradient">
      <Navigation />
      <main className="max-w-3xl mx-auto px-4 py-10">
        <div className="flex items-center gap-3 mb-2">
          <BookMarked className="w-7 h-7 text-navy" />
          <h1 className="text-2xl font-serif text-navy">Devotional Library</h1>
        </div>
        <p className="text-navy/60 mb-8">
          Multi-day devotional series to help you grow at your own pace.
          Looking for today&rsquo;s reading? Visit <Link href="/daily" className="text-gold hover:text-gold-dark underline">Daily Encouragement</Link>.
        </p>

        {loading && (
          <div className="flex justify-center py-16">
            <div className="w-6 h-6 border-2 border-navy/20 border-t-navy rounded-full animate-spin" />
          </div>
        )}

        {!loading && error && <div className="text-center py-16 text-navy/60">{error}</div>}

        {!loading && !error && series.length === 0 && (
          <div className="text-center py-16 text-navy/50">
            <BookMarked className="w-10 h-10 mx-auto mb-3 opacity-40" />
            <p>No devotional series are published yet — check back soon.</p>
          </div>
        )}

        {!loading && !error && series.length > 0 && (
          <ul className="space-y-3">
            {series.map(s => (
              <li key={s.slug}>
                <Link
                  href={`/devotionals/${s.slug}`}
                  className="flex items-center gap-4 p-5 rounded-xl bg-white hover:bg-cream border border-navy/8 hover:border-gold/20 transition-all duration-200"
                >
                  <div className="flex-1 min-w-0">
                    <h3 className="font-serif text-navy mb-1">{s.title}</h3>
                    {s.description && <p className="text-sm text-navy/60 line-clamp-2">{s.description}</p>}
                    <div className="flex items-center gap-1.5 mt-2 text-xs text-navy/40">
                      <Clock className="w-3 h-3" /> {s.duration_days} days · {s.category}
                    </div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </main>
      <Footer />
    </div>
  )
}
