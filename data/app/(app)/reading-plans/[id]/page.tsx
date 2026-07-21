'use client'
import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { ArrowLeft, BookOpen, Clock } from 'lucide-react'
import Navigation from '@/components/layout/Navigation'
import Footer from '@/components/layout/Footer'
import { bibleBooks } from '@/data/mock'

// Reading Plan detail — new this session. Uses the raw UUID `id` as the
// route param (see API route comment for why no slug is used). Shows real
// ordered days and items from ReadingDay/ReadingItem — nothing invented.
// Book names are resolved via the existing static `bibleBooks` reference
// list (factual book-code-to-name mapping already in the codebase, not
// app-generated content) where available; falls back to the raw book code
// honestly where a book isn't in that partial list, rather than guessing.

type Item = { id: string; book_id: string; chapter: number; sort_order: number }
type Day  = { id: string; day_number: number; title: string | null; description: string | null; readings: Item[] }
type PlanDetail = {
  id: string; title: string; description: string | null
  duration_days: number; difficulty: string; days: Day[]
}

function bookName(code: string): string {
  return bibleBooks.find(b => b.id === code)?.name ?? code
}

export default function ReadingPlanDetailPage({ params }: { params: { id: string } }) {
  const [plan,    setPlan]    = useState<PlanDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res  = await fetch(`/api/v1/reading-plans/${params.id}`)
      const body = await res.json()
      if (res.status === 404) { setError('not_found'); return }
      if (!body.success) throw new Error()
      setPlan(body.data)
    } catch {
      setError('This reading plan couldn\u2019t be loaded. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [params.id])

  useEffect(() => { load() }, [load])

  return (
    <div className="min-h-screen bg-cream pt-16">
      <Navigation />
      <main className="max-w-2xl mx-auto px-4 py-10">
        <Link href="/reading-plans" className="inline-flex items-center gap-1.5 text-sm text-navy/60 hover:text-navy mb-6">
          <ArrowLeft className="w-4 h-4" /> Reading Plans
        </Link>

        {loading && (
          <div className="flex justify-center py-16">
            <div className="w-6 h-6 border-2 border-navy/20 border-t-navy rounded-full animate-spin" />
          </div>
        )}

        {!loading && error === 'not_found' && (
          <div className="text-center py-16 text-navy/50">
            <BookOpen className="w-10 h-10 mx-auto mb-3 opacity-40" />
            <p>This reading plan doesn&rsquo;t exist or isn&rsquo;t published yet.</p>
          </div>
        )}

        {!loading && error && error !== 'not_found' && (
          <div className="text-center py-16 text-navy/60">{error}</div>
        )}

        {!loading && !error && plan && (
          <>
            <h1 className="text-3xl font-serif text-navy mb-2">{plan.title}</h1>
            {plan.description && <p className="text-navy/60 mb-4 leading-relaxed">{plan.description}</p>}
            <div className="flex items-center gap-3 mb-8 text-sm text-navy/50">
              <span className="flex items-center gap-1"><Clock className="w-4 h-4" /> {plan.duration_days} days</span>
              <span className="capitalize">{plan.difficulty}</span>
            </div>

            {plan.days.length === 0 ? (
              <p className="text-navy/50 text-sm">This plan&rsquo;s daily readings haven&rsquo;t been published yet.</p>
            ) : (
              <ul className="space-y-2">
                {plan.days.map(day => (
                  <li key={day.id} className="p-4 rounded-xl bg-white border border-navy/8">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs uppercase tracking-wide text-navy/40">Day {day.day_number}</span>
                    </div>
                    {day.title && <h3 className="font-serif text-navy mb-1">{day.title}</h3>}
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      {day.readings.map(item => (
                        <span key={item.id} className="px-2 py-0.5 rounded-full bg-navy/5 text-navy/70 text-xs">
                          {bookName(item.book_id)} {item.chapter}
                        </span>
                      ))}
                    </div>
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
