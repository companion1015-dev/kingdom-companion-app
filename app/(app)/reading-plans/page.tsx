'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Clock, Play, RotateCcw, Pause, Check, BookOpen } from 'lucide-react'
import Navigation from '@/components/layout/Navigation'
import Footer from '@/components/layout/Footer'

// Reading Plans index — real API-backed plan data (previous session), with
// Reading Plans Progress sync now implemented per the finalised Option C
// decision record (Anonymous-First with Optional Authenticated
// Synchronisation):
//
//   - Anonymous users: unchanged. localStorage remains the sole mechanism,
//     no network call to the progress endpoint occurs, no behaviour change.
//   - Authenticated users: on mount, a REAL check against
//     GET /api/v1/reading-plans/progress determines auth state (200 vs 401)
//     — never a hardcoded value, unlike the Study module's dormant pattern
//     this task explicitly warned against copying. Local and server
//     progress are merged (server applies the "more-advanced-progress-wins"
//     rule — see the API route), then every subsequent mutation
//     (start/pause/mark day/reset) also pushes to the server so multi-device
//     sync stays live, not just a one-time migration at sign-in.
//   - Reset remains destructive (product decision #5) and is propagated
//     server-side via a `reset` flag on the sync payload, not a separate
//     DELETE route (minimum required GET/PUT surface only, per approved scope).
//   - Day-level granularity, one record per user per plan — unchanged
//     (product decisions #6, #7).

type Plan = {
  id: string
  title: string
  description: string | null
  duration_days: number
  difficulty: string
}

type Progress = { planId: string; currentDay: number; completed: boolean; paused: boolean; startedAt: string }

const PROGRESS_KEY        = 'bc_reading_progress'
// Correction (audit finding #2): a durable, separate queue of planIds still
// owed a server-side delete. Decoupled from the main progress cache so that
// a reset performed before auth status is known, or one whose sync attempt
// fails outright, is never silently forgotten — it persists here until a
// later opportunity (auth resolving, or the next page load) confirms it.
const PENDING_RESETS_KEY  = 'bc_reading_progress_pending_resets'

function loadProgress(): Record<string, Progress> {
  try { return JSON.parse(localStorage.getItem(PROGRESS_KEY) ?? '{}') } catch { return {} }
}
function saveProgress(data: Record<string, Progress>) {
  try { localStorage.setItem(PROGRESS_KEY, JSON.stringify(data)) } catch { /* ignore */ }
}
function loadPendingResets(): string[] {
  try { return JSON.parse(localStorage.getItem(PENDING_RESETS_KEY) ?? '[]') } catch { return [] }
}
function savePendingResets(ids: string[]) {
  try { localStorage.setItem(PENDING_RESETS_KEY, JSON.stringify(ids)) } catch { /* ignore */ }
}

// Sync to the server — returns whether it actually succeeded, so a caller
// managing a durable queue (pending resets) can tell confirmed delivery
// apart from a swallowed failure, rather than assuming success optimistically.
async function pushProgress(entries: (Progress & { reset?: boolean })[]): Promise<boolean> {
  try {
    const res  = await fetch('/api/v1/reading-plans/progress', {
      method:      'PUT',
      headers:     { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        entries: entries.map(e => ({
          planId: e.planId, currentDay: e.currentDay, completed: e.completed,
          paused: e.paused, startedAt: e.startedAt, ...(e.reset && { reset: true }),
        })),
      }),
    })
    const body = await res.json()
    return res.ok && body.success
  } catch {
    return false
  }
}

const DIFFICULTIES = ['All', 'beginner', 'intermediate', 'advanced']
const diffLabel = (d: string) => d.charAt(0).toUpperCase() + d.slice(1)
const diffColor: Record<string, string> = {
  beginner:     'bg-green-100 text-green-700',
  intermediate: 'bg-amber-100 text-amber-700',
  advanced:     'bg-red-100 text-red-700',
}

export default function ReadingPlansPage() {
  const [plans,    setPlans]    = useState<Plan[] | null>(null)
  const [error,    setError]    = useState(false)
  const [progress, setProgress] = useState<Record<string, Progress>>({})
  const [filter,   setFilter]   = useState<string>('All')
  const [toast,    setToast]    = useState<string | null>(null)
  const [authed,   setAuthed]   = useState(false) // Real check only — see effect below. Never hardcoded.

  useEffect(() => {
    const local = loadProgress()
    setProgress(local)

    fetch('/api/v1/reading-plans')
      .then(r => r.json())
      .then(body => {
        if (!body.success) throw new Error()
        setPlans(body.data)
      })
      .catch(() => setError(true))

    // Real authentication check — the same 401-vs-200 convention already
    // established for /journal, reused rather than a new pattern invented.
    fetch('/api/v1/reading-plans/progress', { credentials: 'include' })
      .then(async res => {
        if (res.status === 401) return // Anonymous — no behaviour change.
        const body = await res.json()
        if (!body.success) return
        setAuthed(true)

        // Correction (audit finding #2): flush any resets still owed to the
        // server BEFORE pulling server rows into local state, and exclude
        // every plan that was ever queued for reset — whether this flush
        // confirms it or it's still failing — from being resurrected by the
        // merge-down step below. A reset the user made is never re-adopted
        // from a stale server row just because its own sync hasn't
        // succeeded yet.
        const queuedResets = loadPendingResets()
        const excludeFromMerge = new Set(queuedResets)
        if (queuedResets.length > 0) {
          const ok = await pushProgress(queuedResets.map(planId => ({
            planId, currentDay: 1, completed: false, paused: false,
            startedAt: new Date().toISOString(), reset: true,
          })))
          if (ok) savePendingResets([]) // Confirmed — clear the queue. Left intact otherwise, retried next time.
        }

        // Merge: start from local, layer in any server-only plans (from
        // another device) that aren't in local yet — except anything just
        // excluded above.
        const merged = { ...local }
        for (const row of body.data as { readingPlanId: string; currentDay: number; completed: boolean; paused: boolean; startedAt: string }[]) {
          if (excludeFromMerge.has(row.readingPlanId)) continue
          if (!merged[row.readingPlanId]) {
            merged[row.readingPlanId] = {
              planId: row.readingPlanId, currentDay: row.currentDay,
              completed: row.completed, paused: row.paused, startedAt: row.startedAt,
            }
          }
        }

        // Push whatever was local (product decision #3: automatic
        // migration) — the server applies the merge rule and returns the
        // authoritative post-merge state for each plan touched.
        const localEntries = Object.values(local)
        if (localEntries.length > 0) {
          const syncRes  = await fetch('/api/v1/reading-plans/progress', {
            method: 'PUT', headers: { 'Content-Type': 'application/json' },
            credentials: 'include', body: JSON.stringify({ entries: localEntries }),
          })
          const syncBody = await syncRes.json()
          if (syncBody.success) {
            for (const row of syncBody.data as { readingPlanId: string; currentDay: number; completed: boolean; paused: boolean; startedAt: string }[]) {
              merged[row.readingPlanId] = {
                planId: row.readingPlanId, currentDay: row.currentDay,
                completed: row.completed, paused: row.paused, startedAt: row.startedAt,
              }
            }
          }
        }

        setProgress(merged)
        saveProgress(merged)
      })
      .catch(() => { /* Treat as anonymous on any network failure — never block the page. */ })
  }, [])

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 2500) }

  const startPlan = (plan: Plan) => {
    const entry   = { planId: plan.id, currentDay: 1, completed: false, paused: false, startedAt: new Date().toISOString() }
    const updated = { ...progress, [plan.id]: entry }
    setProgress(updated); saveProgress(updated)
    if (authed) pushProgress([entry])
    showToast(`Started "${plan.title}" — Day 1 awaits!`)
  }

  const togglePause = (planId: string) => {
    const p = progress[planId]
    if (!p) return
    const entry   = { ...p, paused: !p.paused }
    const updated = { ...progress, [planId]: entry }
    setProgress(updated); saveProgress(updated)
    if (authed) pushProgress([entry])
    showToast(p.paused ? 'Plan resumed' : 'Plan paused')
  }

  const resetPlan = (planId: string) => {
    if (!confirm('Reset this reading plan? Your progress will be lost.')) return
    const updated = { ...progress }; delete updated[planId]
    setProgress(updated); saveProgress(updated)

    // Correction (audit finding #2): the reset intent is recorded durably
    // regardless of whether `authed` is already known — this is what
    // prevents the reset from being silently lost if it happens before the
    // initial auth check resolves, or if the network call below fails.
    // The mount-time effect flushes this queue on its next opportunity
    // either way, so nothing depends on this specific call succeeding.
    const pending = loadPendingResets()
    if (!pending.includes(planId)) savePendingResets([...pending, planId])

    if (authed) {
      pushProgress([{ planId, currentDay: 1, completed: false, paused: false, startedAt: new Date().toISOString(), reset: true }])
        .then(ok => {
          if (ok) savePendingResets(loadPendingResets().filter(id => id !== planId))
        })
    }
    // If not yet authed (or anonymous), the queue entry is simply left in
    // place — harmless for anonymous users (never flushed, never referenced
    // again), and correctly retried for authenticated users on next mount.

    showToast('Plan reset')
  }

  const markDay = (planId: string) => {
    const p    = progress[planId]
    const plan = plans?.find(pl => pl.id === planId)
    if (!p || !plan) return
    const nextDay   = p.currentDay + 1
    const completed = nextDay > plan.duration_days
    const entry     = { ...p, currentDay: Math.min(nextDay, plan.duration_days), completed }
    const updated   = { ...progress, [planId]: entry }
    setProgress(updated); saveProgress(updated)
    if (authed) pushProgress([entry])
    showToast(completed ? `🎉 "${plan.title}" completed!` : `Day ${p.currentDay} marked complete`)
  }

  const filtered     = !plans ? [] : filter === 'All' ? plans : plans.filter(p => p.difficulty === filter)
  const activePlans   = (plans ?? []).filter(p => progress[p.id] && !progress[p.id].completed)

  return (
    <>
      <Navigation />
      <main className="min-h-screen bg-cream pt-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">

          <div className="flex items-center gap-4 mb-8">
            <div className="relative w-12 h-12 rounded-2xl overflow-hidden shadow-md shrink-0">
              <Image src="/images/logo.png" alt="" fill className="object-cover" sizes="48px" />
            </div>
            <div>
              <h1 className="font-display text-3xl font-light text-navy">Reading Plans</h1>
              <p className="text-charcoal/50 font-body text-sm">Build a consistent habit of reading God&rsquo;s Word</p>
            </div>
          </div>

          {plans === null && !error && (
            <div className="flex justify-center py-16">
              <div className="w-6 h-6 border-2 border-navy/20 border-t-navy rounded-full animate-spin" />
            </div>
          )}

          {error && (
            <p className="text-center text-charcoal/50 font-body text-sm py-16">
              Reading plans couldn&rsquo;t be loaded right now. Please try again.
            </p>
          )}

          {plans !== null && !error && plans.length === 0 && (
            <p className="text-center text-charcoal/50 font-body text-sm py-16">
              No reading plans are published yet — check back soon.
            </p>
          )}

          {plans !== null && !error && plans.length > 0 && (
            <>
              {activePlans.length > 0 && (
                <div className="mb-8">
                  <h2 className="font-display text-lg font-semibold text-navy mb-3">Your Active Plans</h2>
                  <div className="space-y-3">
                    {activePlans.map(plan => {
                      const p   = progress[plan.id]
                      const pct = Math.round((p.currentDay / plan.duration_days) * 100)
                      return (
                        <div key={plan.id} className="bg-white rounded-2xl border border-navy/8 p-5">
                          <div className="flex items-start gap-4">
                            <BookOpen className="w-6 h-6 text-navy/40 shrink-0 mt-0.5" />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-2 mb-1">
                                <h3 className="font-body font-semibold text-navy text-sm">{plan.title}</h3>
                                <span className="text-xs text-charcoal/40 font-body shrink-0">Day {p.currentDay}/{plan.duration_days}</span>
                              </div>
                              <div className="w-full bg-navy/8 rounded-full h-1.5 mb-3">
                                <div className="bg-gold h-1.5 rounded-full transition-all" style={{ width: `${pct}%` }} />
                              </div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <button onClick={() => markDay(plan.id)}
                                  className="flex items-center gap-1.5 px-3 py-1.5 bg-navy hover:bg-navy-light text-white text-xs font-body font-medium rounded-full transition-colors">
                                  <Check className="w-3 h-3" /> Mark Day {p.currentDay} Complete
                                </button>
                                <button onClick={() => togglePause(plan.id)}
                                  className="flex items-center gap-1.5 px-3 py-1.5 border border-navy/15 text-navy/60 hover:text-navy text-xs font-body rounded-full transition-colors">
                                  {p.paused ? <><Play className="w-3 h-3" /> Resume</> : <><Pause className="w-3 h-3" /> Pause</>}
                                </button>
                                <button onClick={() => resetPlan(plan.id)}
                                  className="flex items-center gap-1.5 px-3 py-1.5 text-charcoal/35 hover:text-red-500 text-xs font-body rounded-full transition-colors">
                                  <RotateCcw className="w-3 h-3" /> Reset
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              <div className="flex gap-2 overflow-x-auto pb-2 mb-6 scrollbar-hide">
                {DIFFICULTIES.map(d => (
                  <button key={d} onClick={() => setFilter(d)}
                    className={`px-4 py-2 rounded-full text-xs font-body font-medium whitespace-nowrap transition-all shrink-0 ${filter === d ? 'bg-navy text-white' : 'bg-white border border-navy/10 text-charcoal/55 hover:border-navy/25 hover:text-navy'}`}>
                    {d === 'All' ? 'All' : diffLabel(d)}
                  </button>
                ))}
              </div>

              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filtered.map(plan => {
                  const p         = progress[plan.id]
                  const started   = !!p
                  const completed = p?.completed
                  const pct       = p ? Math.round((p.currentDay / plan.duration_days) * 100) : 0

                  return (
                    <div key={plan.id}
                      className={`bg-white rounded-2xl border overflow-hidden hover:shadow-md hover:shadow-navy/8 transition-all duration-200 group ${completed ? 'border-green-200' : 'border-navy/8 hover:border-gold/20'}`}>

                      <Link href={`/reading-plans/${plan.id}`} className="block">
                        <div className={`p-5 ${completed ? 'bg-green-50' : 'bg-cream/50'}`}>
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <BookOpen className="w-6 h-6 text-navy/40" />
                            {completed && <span className="flex items-center gap-1 text-xs font-body font-semibold text-green-600 bg-green-100 px-2 py-0.5 rounded-full"><Check className="w-3 h-3" /> Completed</span>}
                          </div>
                          <h3 className="font-body font-semibold text-navy mb-1">{plan.title}</h3>
                          {plan.description && <p className="text-xs text-charcoal/50 font-body leading-relaxed">{plan.description}</p>}
                        </div>
                      </Link>

                      {started && !completed && (
                        <div className="px-5 pt-3">
                          <div className="flex justify-between text-xs font-body text-charcoal/40 mb-1">
                            <span>Day {p.currentDay}</span><span>{pct}% complete</span>
                          </div>
                          <div className="w-full bg-navy/8 rounded-full h-1.5">
                            <div className="bg-gold h-1.5 rounded-full" style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      )}

                      <div className="p-5 pt-3 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-1 text-xs text-charcoal/40 font-body">
                            <Clock className="w-3 h-3" /> {plan.duration_days} days
                          </div>
                          <span className={`text-xs font-body font-medium px-2 py-0.5 rounded-full ${diffColor[plan.difficulty] ?? 'bg-navy/8 text-navy/60'}`}>
                            {diffLabel(plan.difficulty)}
                          </span>
                        </div>

                        {!started ? (
                          <button onClick={() => startPlan(plan)}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-navy hover:bg-navy-light text-white text-xs font-body font-medium rounded-full transition-colors">
                            <Play className="w-3 h-3" /> Start
                          </button>
                        ) : completed ? (
                          <button onClick={() => resetPlan(plan.id)}
                            className="flex items-center gap-1.5 px-3 py-1.5 border border-navy/15 text-navy/50 text-xs font-body rounded-full hover:text-navy transition-colors">
                            <RotateCcw className="w-3 h-3" /> Restart
                          </button>
                        ) : (
                          <button onClick={() => markDay(plan.id)}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-gold hover:bg-gold-light text-navy text-xs font-body font-semibold rounded-full transition-colors">
                            <Check className="w-3 h-3" /> Day {p?.currentDay}
                          </button>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </>
          )}

          <div className="mt-12 p-6 rounded-2xl bg-navy text-center relative overflow-hidden">
            <div className="absolute top-3 right-4 opacity-8 font-display text-6xl text-white select-none">&ldquo;</div>
            <p className="font-display italic text-white text-lg leading-relaxed mb-3 relative">
              &ldquo;Your word is a lamp for my feet, a light on my path.&rdquo;
            </p>
            <p className="text-gold text-xs font-body font-semibold">— Psalm 119:105</p>
          </div>
        </div>
      </main>
      <Footer />

      {toast && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 px-5 py-2.5 bg-navy text-white text-sm font-body font-medium rounded-full shadow-xl animate-fade-in" role="status">
          {toast}
        </div>
      )}
    </>
  )
}
