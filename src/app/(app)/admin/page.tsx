'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Shield, Users, Flag, MessageSquare, Heart, Users2, Check, EyeOff, X, FolderCog } from 'lucide-react'
import Navigation from '@/components/layout/Navigation'
import Footer from '@/components/layout/Footer'

// Genuinely new page -- real moderation queues, feedback messages, and
// donation records were already accumulating in the database with
// absolutely no way to see or act on any of it before this.

type Stats = {
  total_users: number; pending_reports: number; open_feedback: number
  total_prayer_requests: number; total_donated_cents: number
}
type PrayerReport = {
  id: string; reason: string; details: string | null; created_at: string
  request: { id: string; title: string; content: string; category: string }
}
type FeedbackItem = { id: string; feedback_type: string; subject: string; message: string; created_at: string }
type Donation = { id: string; amount_cents: number; currency: string; frequency: string; donor_display_name: string | null; is_anonymous: boolean; created_at: string; payment_provider: string }

type Tab = 'overview' | 'moderation' | 'feedback' | 'donations'

export default function AdminDashboardPage() {
  const [tab,      setTab]      = useState<Tab>('overview')
  const [stats,    setStats]    = useState<Stats | null>(null)
  const [reports,  setReports]  = useState<PrayerReport[]>([])
  const [feedback, setFeedback] = useState<FeedbackItem[]>([])
  const [donations,setDonations]= useState<Donation[]>([])
  const [loading,  setLoading]  = useState(true)
  const [error,    setError]    = useState<string | null>(null)
  const [toast,    setToast]    = useState<string | null>(null)

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 2500) }

  const load = () => {
    setLoading(true)
    fetch('/api/v1/admin/dashboard', { credentials: 'include' })
      .then(async res => {
        if (res.status === 403) { setError('Administrator access required.'); return }
        if (res.status === 401) { setError('Please sign in as an administrator.'); return }
        const data = await res.json()
        if (data.success) {
          setStats(data.data.stats)
          setReports(data.data.prayer_reports)
          setFeedback(data.data.feedback)
          setDonations(data.data.recent_donations)
        } else setError(data.error?.message ?? 'Unable to load dashboard.')
      })
      .catch(() => setError('Network error. Please try again.'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const runAction = async (action: string, id: string, successMsg: string) => {
    try {
      const res  = await fetch('/api/v1/admin/actions', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include',
        body: JSON.stringify({ action, id }),
      })
      const data = await res.json()
      if (data.success) { showToast(successMsg); load() }
      else showToast(data.error?.message ?? 'Action failed.')
    } catch { showToast('Network error.') }
  }

  const formatMoney = (cents: number, currency = 'USD') =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(cents / 100)

  const TABS: { id: Tab; label: string; icon: typeof Shield }[] = [
    { id: 'overview',   label: 'Overview',   icon: Shield },
    { id: 'moderation', label: 'Moderation', icon: Flag },
    { id: 'feedback',   label: 'Feedback',   icon: MessageSquare },
    { id: 'donations',  label: 'Donations',  icon: Heart },
  ]

  return (
    <div className="min-h-screen bg-cream dark:bg-navy-dark-gradient">
      <Navigation />
      <main className="max-w-3xl mx-auto px-4 py-10">
        <div className="flex items-center gap-3 mb-2">
          <Shield className="w-7 h-7 text-navy dark:text-cream" />
          <h1 className="text-3xl font-serif text-navy dark:text-cream">Admin Dashboard</h1>
        </div>
        <div className="flex items-center justify-between mb-8">
          <p className="text-navy/60 dark:text-cream/60">Moderation, feedback, and ministry activity in one place.</p>
          <Link href="/admin/content" className="flex items-center gap-1.5 px-4 py-2 rounded-full border border-navy/15 text-navy dark:text-cream text-xs font-body font-semibold hover:bg-navy/5 transition-all shrink-0 ml-4">
            <FolderCog className="w-3.5 h-3.5" /> Manage Content
          </Link>
        </div>

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
            {/* Tabs */}
            <div className="flex gap-1 mb-6 p-1 bg-navy/5 rounded-2xl overflow-x-auto">
              {TABS.map(t => (
                <button key={t.id} onClick={() => setTab(t.id)}
                  className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-body font-semibold whitespace-nowrap transition-all ${tab === t.id ? 'bg-white dark:bg-navy-dark text-navy dark:text-cream shadow-sm' : 'text-charcoal/45 dark:text-cream/45 hover:text-navy dark:text-cream'}`}>

                  <t.icon className="w-3.5 h-3.5" /> {t.label}
                  {t.id === 'moderation' && stats.pending_reports > 0 && (
                    <span className="ml-0.5 px-1.5 py-0.5 rounded-full bg-red-500 text-white text-[10px] font-bold">{stats.pending_reports}</span>
                  )}
                  {t.id === 'feedback' && stats.open_feedback > 0 && (
                    <span className="ml-0.5 px-1.5 py-0.5 rounded-full bg-red-500 text-white text-[10px] font-bold">{stats.open_feedback}</span>
                  )}
                </button>
              ))}
            </div>

            {tab === 'overview' && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <StatCard icon={Users2}       label="Total Users"        value={stats.total_users} />
                <StatCard icon={Flag}         label="Pending Reports"    value={stats.pending_reports} accent={stats.pending_reports > 0} />
                <StatCard icon={MessageSquare}label="Open Feedback"      value={stats.open_feedback} accent={stats.open_feedback > 0} />
                <StatCard icon={Heart}        label="Prayer Requests"    value={stats.total_prayer_requests} />
                <StatCard icon={Heart}        label="Total Given"        value={formatMoney(stats.total_donated_cents)} isText />
              </div>
            )}

            {tab === 'moderation' && (
              <div className="space-y-3">
                {reports.length === 0 && <EmptyState text="No pending reports — the Prayer Wall is clean." />}
                {reports.map(r => (
                  <div key={r.id} className="bg-white dark:bg-navy-dark rounded-2xl border border-navy/8 p-5">
                    <div className="flex items-center justify-between mb-2">
                      <span className="px-2 py-0.5 rounded-full bg-red-50 text-red-600 text-xs font-body font-semibold capitalize">{r.reason}</span>
                      <span className="text-xs text-charcoal/30 dark:text-cream/30 font-body">{new Date(r.created_at).toLocaleDateString()}</span>
                    </div>
                    <h3 className="font-display text-sm font-semibold text-navy dark:text-cream mb-1">{r.request?.title ?? '(request removed)'}</h3>
                    <p className="text-xs text-charcoal/55 dark:text-cream/55 font-body mb-2 line-clamp-2">{r.request?.content}</p>
                    {r.details && <p className="text-xs text-charcoal/40 dark:text-cream/40 font-body italic mb-3">Reporter note: {r.details}</p>}
                    <div className="flex gap-2">
                      <button onClick={() => runAction('dismiss_report', r.id, 'Report dismissed')}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-navy/12 text-navy/60 dark:text-cream/60 hover:text-navy dark:text-cream text-xs font-body font-medium transition-all">
                        <Check className="w-3.5 h-3.5" /> Dismiss
                      </button>
                      {r.request?.id && (
                        <button onClick={() => runAction('hide_prayer', r.request.id, 'Prayer request hidden')}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 text-xs font-body font-medium transition-all">
                          <EyeOff className="w-3.5 h-3.5" /> Hide Post
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {tab === 'feedback' && (
              <div className="space-y-3">
                {feedback.length === 0 && <EmptyState text="No open feedback messages." />}
                {feedback.map(f => (
                  <div key={f.id} className="bg-white dark:bg-navy-dark rounded-2xl border border-navy/8 p-5">
                    <div className="flex items-center justify-between mb-2">
                      <span className="px-2 py-0.5 rounded-full bg-navy/8 text-navy dark:text-cream text-xs font-body font-semibold">{f.feedback_type}</span>
                      <span className="text-xs text-charcoal/30 dark:text-cream/30 font-body">{new Date(f.created_at).toLocaleDateString()}</span>
                    </div>
                    <h3 className="font-display text-sm font-semibold text-navy dark:text-cream mb-1">{f.subject}</h3>
                    <p className="text-xs text-charcoal/55 dark:text-cream/55 font-body mb-3">{f.message}</p>
                    <button onClick={() => runAction('resolve_feedback', f.id, 'Marked resolved')}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-navy/12 text-navy/60 dark:text-cream/60 hover:text-navy dark:text-cream text-xs font-body font-medium transition-all">
                      <Check className="w-3.5 h-3.5" /> Mark Resolved
                    </button>
                  </div>
                ))}
              </div>
            )}

            {tab === 'donations' && (
              <div className="space-y-2">
                {donations.length === 0 && <EmptyState text="No donations recorded yet." />}
                {donations.map(d => (
                  <div key={d.id} className="bg-white dark:bg-navy-dark rounded-2xl border border-navy/8 p-4 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-body font-semibold text-navy dark:text-cream">
                        {formatMoney(d.amount_cents, d.currency)} <span className="text-xs text-charcoal/40 dark:text-cream/40 font-normal capitalize">· {d.frequency.replace('_', ' ')} · {d.payment_provider}</span>
                      </p>
                      <p className="text-xs text-charcoal/45 dark:text-cream/45 font-body">{d.is_anonymous ? 'Anonymous' : d.donor_display_name ?? 'No name provided'}</p>
                    </div>
                    <span className="text-xs text-charcoal/30 dark:text-cream/30 font-body shrink-0">{new Date(d.created_at).toLocaleDateString()}</span>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </main>

      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-5 py-2.5 bg-navy text-white text-sm font-body font-medium rounded-full shadow-xl" role="status">
          {toast}
        </div>
      )}

      <Footer />
    </div>
  )
}

function StatCard({ icon: Icon, label, value, accent, isText }: { icon: typeof Shield; label: string; value: number | string; accent?: boolean; isText?: boolean }) {
  return (
    <div className={`rounded-2xl border p-4 ${accent ? 'bg-red-50 border-red-100' : 'bg-white dark:bg-navy-dark border-navy/8'}`}>
      <Icon className={`w-4 h-4 mb-2 ${accent ? 'text-red-500' : 'text-navy/40 dark:text-cream/40'}`} />
      <p className={`font-display font-light text-navy dark:text-cream ${isText ? 'text-lg' : 'text-2xl'}`}>{value}</p>
      <p className="text-xs text-charcoal/45 dark:text-cream/45 font-body">{label}</p>
    </div>
  )
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="bg-white dark:bg-navy-dark rounded-2xl border border-navy/8 p-10 text-center">
      <X className="w-8 h-8 text-navy/15 dark:text-cream/15 mx-auto mb-2" />
      <p className="text-charcoal/45 dark:text-cream/45 font-body text-sm">{text}</p>
    </div>
  )
}
