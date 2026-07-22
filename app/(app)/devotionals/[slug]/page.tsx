'use client'
import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { BookMarked, ArrowLeft } from 'lucide-react'
import Navigation from '@/components/layout/Navigation'
import Footer from '@/components/layout/Footer'

type Entry = {
  id: string
  day_number: number
  title: string
  theme: string | null
  central_verse_reference: string
  reflection: string
  guided_prayer: string
  practical_application: string | null
  is_ai_generated: boolean
  ai_disclosure_text: string | null
}
type SeriesDetail = { id: string; slug: string; title: string; description: string | null; entries: Entry[] }

export default function DevotionalSeriesPage({ params }: { params: { slug: string } }) {
  const [series,  setSeries]  = useState<SeriesDetail | null>(null)
  const [openDay, setOpenDay] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res  = await fetch(`/api/v1/devotionals/series/${params.slug}`)
      const body = await res.json()
      if (res.status === 404) { setError('not_found'); return }
      if (!body.success) throw new Error()
      setSeries(body.data)
      setOpenDay(body.data.entries[0]?.day_number ?? null)
    } catch {
      setError('This devotional series couldn\u2019t be loaded. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [params.slug])

  useEffect(() => { load() }, [load])

  return (
    <div className="min-h-screen bg-cream-gradient">
      <Navigation />
      <main className="max-w-3xl mx-auto px-4 py-10">
        <Link href="/devotionals" className="inline-flex items-center gap-1.5 text-sm text-navy/60 hover:text-navy mb-6">
          <ArrowLeft className="w-4 h-4" /> Devotional Library
        </Link>

        {loading && (
          <div className="flex justify-center py-16">
            <div className="w-6 h-6 border-2 border-navy/20 border-t-navy rounded-full animate-spin" />
          </div>
        )}

        {!loading && error === 'not_found' && (
          <div className="text-center py-16 text-navy/50">
            <BookMarked className="w-10 h-10 mx-auto mb-3 opacity-40" />
            <p>This devotional series doesn&rsquo;t exist or isn&rsquo;t published yet.</p>
          </div>
        )}

        {!loading && error && error !== 'not_found' && (
          <div className="text-center py-16 text-navy/60">{error}</div>
        )}

        {!loading && !error && series && (
          <>
            <h1 className="text-3xl font-serif text-navy mb-2">{series.title}</h1>
            {series.description && <p className="text-navy/60 mb-8">{series.description}</p>}

            {series.entries.length === 0 ? (
              <p className="text-navy/50 text-sm">No days have been published for this series yet.</p>
            ) : (
              <ul className="space-y-3">
                {series.entries.map(e => (
                  <li key={e.id} className="rounded-xl bg-white border border-navy/8 overflow-hidden">
                    <button
                      onClick={() => setOpenDay(openDay === e.day_number ? null : e.day_number)}
                      className="w-full flex items-center justify-between p-5 text-left"
                    >
                      <div>
                        <span className="text-xs uppercase tracking-wide text-navy/40">Day {e.day_number}</span>
                        <h3 className="font-serif text-navy">{e.title}</h3>
                      </div>
                    </button>
                    {openDay === e.day_number && (
                      <div className="px-5 pb-5">
                        <div className="p-4 rounded-xl bg-cream border border-navy/8 mb-4">
                          <p className="font-serif italic text-navy">{e.central_verse_reference}</p>
                        </div>
                        <p className="text-navy/80 leading-relaxed mb-4 whitespace-pre-wrap">{e.reflection}</p>
                        {e.is_ai_generated && (
                          <p className="text-xs text-navy/40 italic mb-4">
                            {e.ai_disclosure_text ?? 'This reflection was generated with AI assistance.'}
                          </p>
                        )}
                        <div className="p-4 rounded-xl bg-navy/5">
                          <span className="text-xs uppercase tracking-wide text-navy/40 block mb-1">Prayer</span>
                          <p className="text-navy/80 whitespace-pre-wrap">{e.guided_prayer}</p>
                        </div>
                        {e.practical_application && (
                          <div className="mt-4 p-4 rounded-xl bg-gold/10">
                            <span className="text-xs uppercase tracking-wide text-navy/40 block mb-1">This Week</span>
                            <p className="text-navy/80 whitespace-pre-wrap">{e.practical_application}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </main>
      <Footer />
    </div>
  )
}
