'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { LayoutDashboard, BookOpen, Heart, Bookmark, NotebookPen, Highlighter, Gift, ArrowRight } from 'lucide-react'
import Navigation from '@/components/layout/Navigation'
import Footer from '@/components/layout/Footer'

// Genuinely new page -- signed-in users had a Profile (settings) page but no
// single place to see their own activity: Prayer Journal, Reading Plans,
// Prayer Wall submissions, saved prayers, and Study tools.

type Stats = {
  prayer_journal_total: number; prayer_journal_active: number
  reading_plans_in_progress: number; reading_plans_completed: number
  prayer_requests_submitted: number; saved_prayers: number
  study_notes: number; study_highlights: number; study_bookmarks: number
  total_given_cents: number
}
type JournalPrayer = { id: string; title: string; status: string; updated_at: string }
type ReadingProgress = {
  reading_plan_id: string; current_day: number; completed: boolean; paused: boolean
  completion_percentage: string; reading_plan: { title: string; duration_days: number }
}
type MyPrayerRequest = { id: string; title: string; category: string; privacy: string; moderation_status: string; prayer_count: number; created_at: string }
type SavedPrayer = { id: string; created_at: string; request: { id: string; title: string; category: string } | null }

export default function DashboardPage() {
  const [stats,     setStats]     = useState<Stats | null>(null)
  const [journal,    setJournal]    = useState<JournalPrayer[]>([])
  const [reading,    setReading]    = useState<ReadingProgress[]>([])
  const [myRequests, setMyRequests] = useState<MyPrayerRequest[]>([])
  const [saved,      setSaved]      = useState<SavedPrayer[]>([])
  const [loading,    setLoading]    = useState(true)
  const [error,      setError]      = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/v1/user/dashboard', { credentials: 'include' })
      .then(async res => {
        if (res.status === 401) { setError('Please sign in to view your dashboard.'); return }
        const data = await res.json()
        if (data.success) {
          setStats(data.data.stats)
          setJournal(data.data.recent_journal_prayers)
          setReading(data.data.reading_progress)
          setMyRequests(data.data.my_prayer_requests)
          setSaved(data.data.saved_prayers)
        } else setError(data.error?.message ?? 'Unable to load your dashboard.')
      })
      .catch(() => setError('Network error. Please try again.'))
      .finally(() => setLoading(false))
  }, [])

  const formatMoney = (cents: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(cents / 100)

  return (
    <div className="min-h-screen bg-cream dark:bg-navy-dark-gradient">
      <Navigation />
      <main className="max-w-3xl mx-auto px-4 py-10">
        <div className="flex items-center gap-3 mb-2">
          <LayoutDashboard className="w-7 h-7 text-navy dark:text-cream" />
          <h1 className="text-3xl font-serif text-navy dark:text-cream">My Dashboard</h1>
        </div>
        <p className="text-navy/60 dark:text-cream/60 mb-8">Your prayer journal, reading plans, and activity in one place.</p>

        {loading && (
          <div className="flex justify-center py-16">
            <div className="w-6 h-6 border-2 border-navy/20 border-t-navy rounded-full animate-spin" />
          </div>
        )}

        {!loading && error && (
          <div className="bg-white dark:bg-navy-dark rounded-2xl border border-navy/8 p-8 text-center">
            <p className="text-charcoal/55 dark:text-cream/55 font-body text-sm mb-4">{error}</p>
            {error.includes('sign in') && (
              <Link href="/login" className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-navy hover:bg-navy-light text-white text-sm font-body font-semibold transition-all">
                Sign In
              </Link>
            )}
          </div>
        )}

        {!loading && !error && stats && (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-8">
              <StatCard icon={NotebookPen}  label="Journal Prayers"  value={stats.prayer_journal_total} />
              <StatCard icon={BookOpen}     label="Plans In Progress" value={stats.reading_plans_in_progress} />
              <StatCard icon={Heart}        label="Prayer Wall Posts" value={stats.prayer_requests_submitted} />
              <StatCard icon={Bookmark}     label="Saved Prayers"    value={stats.saved_prayers} />
              <StatCard icon={Highlighter}  label="Study Items"      value={stats.study_notes + stats.study_highlights + stats.study_bookmarks} />
              <StatCard icon={Gift}         label="Total Given"      value={formatMoney(stats.total_given_cents)} isText />
            </div>

            <Section title="Prayer Journal" href="/journal" cta="Open Journal">
              {journal.length === 0 && <EmptyState text="No prayer journal entries yet." />}
              {journal.map(p => (
                <Row key={p.id} title={p.title} subtitle={p.status} date={p.updated_at} />
              ))}
            </Section>

            <Section title="Reading Plans" href="/reading-plans" cta="Browse Plans">
              {reading.length === 0 && <EmptyState text="You haven't started a reading plan yet." />}
              {reading.map(r => (
                <div key={r.reading_plan_id} className="bg-white dark:bg-navy-dark rounded-2xl border border-navy/8 p-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-body font-semibold text-navy dark:text-cream">{r.reading_plan?.title ?? 'Reading plan'}</p>
                    <span className="text-xs text-charcoal/40 dark:text-cream/40 font-body">
                      {r.completed ? 'Completed' : r.paused ? 'Paused' : `Day ${r.current_day}/${r.reading_plan?.duration_days ?? '?'}`}
                    </span>
                  </div>
                  <div className="h-1.5 bg-navy/6 rounded-full overflow-hidden">
                    <div className="h-1.5 bg-gold transition-all" style={{ width: `${Number(r.completion_percentage)}%` }} />
                  </div>
                </div>
              ))}
            </Section>

            <Section title="My Prayer Wall Requests" href="/prayer-wall" cta="Open Prayer Wall">
              {myRequests.length === 0 && <EmptyState text="You haven't submitted a prayer request yet." />}
              {myRequests.map(r => (
                <Row key={r.id} title={r.title} subtitle={`${r.moderation_status} · ${r.prayer_count} prayed`} date={r.created_at} />
              ))}
            </Section>

            <Section title="Saved Prayers" href="/prayer-wall" cta="Open Prayer Wall">
              {saved.length === 0 && <EmptyState text="No saved prayers yet." />}
              {saved.map(s => (
                <Row key={s.id} title={s.request?.title ?? '(request removed)'} subtitle={s.request?.category ?? ''} date={s.created_at} />
              ))}
            </Section>
          </>
        )}
      </main>
      <Footer />
    </div>
  )
}

function Section({ title, href, cta, children }: { title: string; href: string; cta: string; children: React.ReactNode }) {
  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-display text-lg font-semibold text-navy dark:text-cream">{title}</h2>
        <Link href={href} className="flex items-center gap-1 text-xs font-body font-semibold text-navy/60 dark:text-cream/60 hover:text-navy dark:text-cream transition-colors">
          {cta} <ArrowRight className="w-3 h-3" />
        </Link>
      </div>
      <div className="space-y-2">{children}</div>
    </div>
  )
}

function Row({ title, subtitle, date }: { title: string; subtitle: string; date: string }) {
  return (
    <div className="bg-white dark:bg-navy-dark rounded-2xl border border-navy/8 p-4 flex items-center justify-between">
      <div className="min-w-0">
        <p className="text-sm font-body font-semibold text-navy dark:text-cream truncate">{title}</p>
        <p className="text-xs text-charcoal/45 dark:text-cream/45 font-body capitalize">{subtitle}</p>
      </div>
      <span className="text-xs text-charcoal/30 dark:text-cream/30 font-body shrink-0 ml-3">{new Date(date).toLocaleDateString()}</span>
    </div>
  )
}

function StatCard({ icon: Icon, label, value, isText }: { icon: typeof LayoutDashboard; label: string; value: number | string; isText?: boolean }) {
  return (
    <div className="rounded-2xl border p-4 bg-white dark:bg-navy-dark border-navy/8">
      <Icon className="w-4 h-4 mb-2 text-navy/40 dark:text-cream/40" />
      <p className={`font-display font-light text-navy dark:text-cream ${isText ? 'text-lg' : 'text-2xl'}`}>{value}</p>
      <p className="text-xs text-charcoal/45 dark:text-cream/45 font-body">{label}</p>
    </div>
  )
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="bg-white dark:bg-navy-dark rounded-2xl border border-navy/8 p-8 text-center">
      <p className="text-charcoal/45 dark:text-cream/45 font-body text-sm">{text}</p>
    </div>
  )
}
