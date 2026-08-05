'use client'
import { useState, useEffect, useCallback } from 'react'
import { Heart, Plus, Sparkles, Flame } from 'lucide-react'
import Navigation from '@/components/layout/Navigation'
import Footer from '@/components/layout/Footer'
import PrayerCard from '@/modules/prayer-wall/components/PrayerCard'
import SubmitPrayerForm from '@/modules/prayer-wall/components/SubmitPrayerForm'
import TestimonyModal from '@/modules/prayer-wall/components/TestimonyModal'
import { fetchPrayerFeed, fetchPraiseReports, formatPrayerTime } from '@/modules/prayer-wall/services/prayer-service'
import { PRAYER_CATEGORIES } from '@/modules/prayer-wall/types'
import type { PrayerRequest, PrayerCategory, PrayerAnswered } from '@/modules/prayer-wall/types'

type SortOption = 'recent' | 'most_prayed' | 'answered'
type CategoryFilter = PrayerCategory | 'all'
type ViewMode = 'feed' | 'praise'

export default function PrayerWallPage() {
  const [view,      setView]      = useState<ViewMode>('feed')
  const [requests, setRequests] = useState<PrayerRequest[]>([])
  const [loading,  setLoading]  = useState(true)
  const [error,    setError]    = useState<string | null>(null)
  const [category, setCategory] = useState<CategoryFilter>('all')
  const [sort,     setSort]     = useState<SortOption>('recent')
  const [page,     setPage]     = useState(1)
  const [hasMore,  setHasMore]  = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [toast,    setToast]    = useState<string | null>(null)
  const [testimonyTarget, setTestimonyTarget] = useState<{ id: string; title: string } | null>(null)
  const [praiseReports, setPraiseReports] = useState<PrayerAnswered[]>([])
  const [praiseLoading, setPraiseLoading] = useState(false)

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 2500) }

  const load = useCallback(async (targetPage: number, append: boolean) => {
    setLoading(true)
    setError(null)
    try {
      const result = await fetchPrayerFeed({ category, sort, page: targetPage, limit: 10 })
      setRequests(prev => append ? [...prev, ...result.requests] : result.requests)
      setHasMore(result.hasMore)
      setPage(targetPage)
    } catch {
      setError('Something went wrong loading the Prayer Wall. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [category, sort])

  useEffect(() => { load(1, false) }, [load])

  const loadPraise = useCallback(async () => {
    setPraiseLoading(true)
    try {
      const reports = await fetchPraiseReports()
      setPraiseReports(reports)
    } finally {
      setPraiseLoading(false)
    }
  }, [])

  useEffect(() => { if (view === 'praise') loadPraise() }, [view, loadPraise])

  const handleTestimonySuccess = () => {
    setTestimonyTarget(null)
    showToast('🎉 Testimony shared — praise God!')
    load(1, false)
    if (view === 'praise') loadPraise()
  }

  const handleSubmitted = () => {
    setShowForm(false)
    showToast('🙏 Your prayer request has been shared')
    load(1, false)
  }

  return (
    <div className="min-h-screen bg-cream dark:bg-navy-dark-gradient">
      <Navigation />

      <main className="max-w-2xl mx-auto px-4 py-10">
        {/* Header */}
        <div className="flex items-center gap-3 mb-2">
          <Heart className="w-7 h-7 text-navy dark:text-cream" />
          <h1 className="text-2xl font-serif text-navy dark:text-cream">Global Prayer Wall</h1>
        </div>
        <p className="text-navy/60 dark:text-cream/60 mb-8">
          Praying with Christians around the world. Share a request, or lift someone else up today.
        </p>

        {/* Submit button */}
        <button
          onClick={() => setShowForm(true)}
          className="w-full flex items-center justify-center gap-2 mb-6 px-4 py-3.5 rounded-2xl bg-navy hover:bg-navy-light text-white text-sm font-body font-semibold transition-all"
        >
          <Plus className="w-4 h-4" /> Share a Prayer Request
        </button>

        {/* View toggle: Feed vs Praise Reports */}
        <div className="flex gap-2 mb-6 p-1 bg-navy/5 rounded-2xl">
          <button
            onClick={() => setView('feed')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-body font-semibold transition-all ${view === 'feed' ? 'bg-white dark:bg-navy-dark text-navy dark:text-cream shadow-sm' : 'text-charcoal/45 dark:text-cream/45 hover:text-navy dark:text-cream'}`}
          >
            <Heart className="w-3.5 h-3.5" /> Prayer Feed
          </button>
          <button
            onClick={() => setView('praise')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-body font-semibold transition-all ${view === 'praise' ? 'bg-white dark:bg-navy-dark text-navy dark:text-cream shadow-sm' : 'text-charcoal/45 dark:text-cream/45 hover:text-navy dark:text-cream'}`}
          >
            <Flame className="w-3.5 h-3.5" /> Praise Reports
          </button>
        </div>

        {view === 'feed' && (
        <>
        {/* Category filter */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-4 scrollbar-hide">
          <button
            onClick={() => setCategory('all')}
            className={`px-3.5 py-2 rounded-full text-xs font-body font-medium whitespace-nowrap transition-all shrink-0 ${category === 'all' ? 'bg-navy text-white' : 'bg-white dark:bg-navy-dark border border-navy/10 text-charcoal/55 dark:text-cream/55 hover:border-navy/25'}`}
          >
            All
          </button>
          {PRAYER_CATEGORIES.map(cat => (
            <button
              key={cat.id}
              onClick={() => setCategory(cat.id)}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-body font-medium whitespace-nowrap transition-all shrink-0 ${category === cat.id ? 'bg-navy text-white' : 'bg-white dark:bg-navy-dark border border-navy/10 text-charcoal/55 dark:text-cream/55 hover:border-navy/25'}`}
            >
              <span>{cat.icon}</span> {cat.label}
            </button>
          ))}
        </div>

        {/* Sort options */}
        <div className="flex gap-2 mb-6">
          {([
            { id: 'recent' as const,      label: 'Latest' },
            { id: 'most_prayed' as const, label: 'Most Prayed' },
            { id: 'answered' as const,    label: 'Answered' },
          ]).map(s => (
            <button
              key={s.id}
              onClick={() => setSort(s.id)}
              className={`px-3 py-1.5 rounded-full text-xs font-body transition-colors ${sort === s.id ? 'bg-gold/15 text-gold-dark font-semibold' : 'text-charcoal/45 dark:text-cream/45 hover:text-navy dark:text-cream'}`}
            >
              {s.label}
            </button>
          ))}
        </div>

        {/* Feed */}
        {loading && page === 1 && (
          <div className="flex justify-center py-16">
            <div className="w-6 h-6 border-2 border-navy/20 border-t-navy rounded-full animate-spin" />
          </div>
        )}

        {!loading && error && (
          <div className="text-center py-16 text-navy/60 dark:text-cream/60">{error}</div>
        )}

        {!loading && !error && requests.length === 0 && (
          <div className="text-center py-16 text-navy/50 dark:text-cream/50">
            <Heart className="w-10 h-10 mx-auto mb-3 opacity-40" />
            <p>No prayer requests here yet. Be the first to share one.</p>
          </div>
        )}

        {!loading && !error && requests.length > 0 && (
          <div className="space-y-4">
            {requests.map(r => (
              <PrayerCard
                key={r.id}
                prayer={r}
                isOwner={r.is_owner}
                onAnswer={() => setTestimonyTarget({ id: r.id, title: r.title })}
              />
            ))}
          </div>
        )}

        {/* Load more */}
        {!loading && hasMore && (
          <button
            onClick={() => load(page + 1, true)}
            className="w-full mt-6 py-3 rounded-2xl border border-navy/12 text-navy/60 dark:text-cream/60 hover:border-navy/25 hover:text-navy dark:text-cream text-sm font-body font-medium transition-all"
          >
            Load more requests
          </button>
        )}

        {loading && page > 1 && (
          <div className="flex justify-center py-6">
            <div className="w-5 h-5 border-2 border-navy/20 border-t-navy rounded-full animate-spin" />
          </div>
        )}
        </>
        )}

        {/* Praise Reports view */}
        {view === 'praise' && (
          <div>
            <p className="text-sm text-charcoal/50 dark:text-cream/50 font-body mb-6">
              Real testimonies from believers whose prayers were answered — shared to strengthen others facing the same thing.
            </p>

            {praiseLoading && (
              <div className="flex justify-center py-16">
                <div className="w-6 h-6 border-2 border-navy/20 border-t-navy rounded-full animate-spin" />
              </div>
            )}

            {!praiseLoading && praiseReports.length === 0 && (
              <div className="text-center py-16 text-navy/50 dark:text-cream/50">
                <Flame className="w-10 h-10 mx-auto mb-3 opacity-40" />
                <p>No public testimonies yet. When a prayer is answered, be the first to share how God moved.</p>
              </div>
            )}

            {!praiseLoading && praiseReports.length > 0 && (
              <div className="space-y-4">
                {praiseReports.map(p => (
                  <div key={p.id} className="bg-white dark:bg-navy-dark rounded-2xl border border-green-100 p-5">
                    <div className="flex items-center gap-2 mb-2">
                      <Flame className="w-4 h-4 text-green-600" />
                      <span className="text-xs font-body font-semibold text-green-700 uppercase tracking-wide">{p.praise_category}</span>
                      <span className="text-xs text-charcoal/30 dark:text-cream/30 font-body ml-auto">{formatPrayerTime(p.created_at)}</span>
                    </div>
                    {p.request_title && <h3 className="font-display text-base font-semibold text-navy dark:text-cream mb-1.5">{p.request_title}</h3>}
                    <p className="text-sm text-charcoal/65 dark:text-cream/65 font-body leading-relaxed mb-3">{p.testimony}</p>
                    {p.bible_verse && (
                      <p className="text-xs text-gold font-body font-medium italic border-l-2 border-gold/40 pl-3 mb-2">{p.bible_verse}</p>
                    )}
                    {p.thanksgiving && (
                      <p className="text-xs text-charcoal/45 dark:text-cream/45 font-body italic">&ldquo;{p.thanksgiving}&rdquo;</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Encouragement footer */}
        <div className="mt-12 p-6 rounded-2xl bg-navy text-center relative overflow-hidden">
          <Sparkles className="w-5 h-5 text-gold mx-auto mb-2" />
          <p className="font-display italic text-white text-base leading-relaxed mb-2">
            &ldquo;Do not be anxious about anything, but in every situation, by prayer and petition,
            with thanksgiving, present your requests to God.&rdquo;
          </p>
          <p className="text-gold text-xs font-body font-semibold">— Philippians 4:6</p>
        </div>
      </main>

      {showForm && (
        <SubmitPrayerForm
          onClose={() => setShowForm(false)}
          onSuccess={handleSubmitted}
        />
      )}

      {testimonyTarget && (
        <TestimonyModal
          requestId={testimonyTarget.id}
          requestTitle={testimonyTarget.title}
          onClose={() => setTestimonyTarget(null)}
          onSuccess={handleTestimonySuccess}
        />
      )}

      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-5 py-2.5 bg-navy text-white text-sm font-body font-medium rounded-full shadow-xl" role="status">
          {toast}
        </div>
      )}

      <Footer />
    </div>
  )
}
