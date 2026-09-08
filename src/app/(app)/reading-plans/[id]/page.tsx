'use client'
import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import {
  ArrowLeft, BookOpen, Clock, ChevronDown, Calendar, Sparkles,
  HeartHandshake, MessageSquare, Play, Pause, Check, RotateCcw,
} from 'lucide-react'
import Navigation from '@/components/layout/Navigation'
import Footer from '@/components/layout/Footer'
import { bibleBooks } from '@/data/mock'
import { bibleHref } from '@/lib/bible-links'
import { localDateKey } from '@/lib/date'

// Reading Plan detail — rebuilt. The previous version dumped all 365 days
// as one flat list of bare "Day N" + chapter chips and never rendered
// `day.description` at all -- every bit of the real per-day content
// (Phase, Library Reading, Reflection Prompt, Prayer Focus, Action Step)
// seeded into the database was invisible on this page. This version parses
// the structured "Label: value" lines the seed data writes into
// `description` (see prisma/seed-integrated-365-day-reading-journey.mjs),
// groups days by Phase, highlights today's real calendar date, and exposes
// the same Start/Pause/Mark Day/Reset progress controls as the plans index
// so a single plan can actually be followed day by day.
//
// Falls back gracefully to the old flat rendering for any plan whose
// description doesn't use this label format (nothing invented for plans
// that don't have it).

type Item = { id: string; book_id: string; chapter: number; sort_order: number }
type Day  = { id: string; day_number: number; title: string | null; description: string | null; readings: Item[] }
type PlanDetail = {
  id: string; title: string; description: string | null
  duration_days: number; difficulty: string; days: Day[]
}
type Progress = { planId: string; currentDay: number; completed: boolean; paused: boolean; startedAt: string }

const PROGRESS_KEY = 'bc_reading_progress'

function loadProgress(): Record<string, Progress> {
  try { return JSON.parse(localStorage.getItem(PROGRESS_KEY) ?? '{}') } catch { return {} }
}
function saveProgress(data: Record<string, Progress>) {
  try { localStorage.setItem(PROGRESS_KEY, JSON.stringify(data)) } catch { /* ignore */ }
}

function bookName(code: string): string {
  return bibleBooks.find(b => b.id === code)?.name ?? code
}

const LABELS = ['Phase', 'Theme', 'Date', 'Library Reading', 'Bible Reading', 'Reflection Prompt', 'Prayer Focus', 'Action Step'] as const
type Parsed = Partial<Record<typeof LABELS[number], string>>

function parseDescription(description: string | null): Parsed {
  if (!description) return {}
  const out: Parsed = {}
  for (const line of description.split('\n')) {
    const m = line.match(/^([A-Za-z ]+):\s(.*)$/)
    if (m && (LABELS as readonly string[]).includes(m[1])) {
      out[m[1] as typeof LABELS[number]] = m[2]
    }
  }
  return out
}

function isoDateFrom(dateLabel: string | undefined): string | null {
  if (!dateLabel) return null
  const m = dateLabel.match(/(\d{4}-\d{2}-\d{2})/)
  return m ? m[1] : null
}

// Maps the plan's "Volume N" label to the real Discipleship Library book
// slug (see prisma/seed-discipleship-library*.mjs) so "Library Reading —
// Volume 1 — Chapter 1: The Gospel — Study day 1 of 6" can link straight
// to that exact chapter at /books/read/{slug}/{chapterNumber}. Integration
// days reference "Volumes 1–3" (no single chapter) and correctly produce
// no link — nothing invented for a reading that isn't one specific chapter.
const VOLUME_SLUGS: Record<string, string> = {
  '1': 'salvation-and-new-life-volume-1',
  '2': 'spiritual-growth-and-christian-living-volume-2',
  '3': 'christian-character-and-relationships-volume-3',
}

function libraryReadingHref(libraryReading: string | undefined): string | null {
  if (!libraryReading) return null
  const volumeMatch  = libraryReading.match(/Volume (\d)\b/)
  const chapterMatch = libraryReading.match(/Chapter (\d+)/)
  if (!volumeMatch || !chapterMatch) return null
  const slug = VOLUME_SLUGS[volumeMatch[1]]
  if (!slug) return null
  return `/books/read/${slug}/${chapterMatch[1]}`
}

export default function ReadingPlanDetailPage({ params }: { params: { id: string } }) {
  const [plan,     setPlan]     = useState<PlanDetail | null>(null)
  const [loading,  setLoading]  = useState(true)
  const [error,    setError]    = useState<string | null>(null)
  const [progress, setProgress] = useState<Progress | null>(null)
  const [authed,   setAuthed]   = useState(false)
  const [openPhase, setOpenPhase] = useState<string | null>(null)
  const [openDays,  setOpenDays]  = useState<Set<string>>(new Set())
  const [toast,     setToast]     = useState<string | null>(null)
  const todayRef = useRef<HTMLLIElement | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res  = await fetch(`/api/v1/reading-plans/${params.id}`)
      const body = await res.json()
      if (res.status === 404) { setError('not_found'); return }
      if (!body.success) throw new Error()
      setPlan(body.data)
    } catch {
      setError('This reading plan couldn’t be loaded. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [params.id])

  useEffect(() => { load() }, [load])

  useEffect(() => {
    const all = loadProgress()
    if (all[params.id]) setProgress(all[params.id])

    fetch('/api/v1/reading-plans/progress', { credentials: 'include' })
      .then(async res => {
        if (res.status === 401) return
        const body = await res.json()
        if (!body.success) return
        setAuthed(true)
      })
      .catch(() => { /* treat as anonymous */ })
  }, [params.id])

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 2500) }

  const pushProgress = (entry: Progress & { reset?: boolean }) => {
    if (!authed) return
    fetch('/api/v1/reading-plans/progress', {
      method: 'PUT', headers: { 'Content-Type': 'application/json' }, credentials: 'include',
      body: JSON.stringify({ entries: [{ planId: entry.planId, currentDay: entry.currentDay, completed: entry.completed, paused: entry.paused, startedAt: entry.startedAt, ...(entry.reset && { reset: true }) }] }),
    }).catch(() => { /* best-effort — localStorage already holds the truth */ })
  }

  const startPlan = () => {
    const entry = { planId: params.id, currentDay: 1, completed: false, paused: false, startedAt: new Date().toISOString() }
    const all = loadProgress(); all[params.id] = entry; saveProgress(all)
    setProgress(entry); pushProgress(entry)
    showToast('Plan started — Day 1 awaits!')
  }

  const markDay = () => {
    if (!progress || !plan) return
    const nextDay   = progress.currentDay + 1
    const completed = nextDay > plan.duration_days
    const entry     = { ...progress, currentDay: Math.min(nextDay, plan.duration_days), completed }
    const all = loadProgress(); all[params.id] = entry; saveProgress(all)
    setProgress(entry); pushProgress(entry)
    showToast(completed ? '🎉 Plan completed!' : `Day ${progress.currentDay} marked complete`)
  }

  const togglePause = () => {
    if (!progress) return
    const entry = { ...progress, paused: !progress.paused }
    const all = loadProgress(); all[params.id] = entry; saveProgress(all)
    setProgress(entry); pushProgress(entry)
    showToast(entry.paused ? 'Plan paused' : 'Plan resumed')
  }

  const resetPlan = () => {
    if (!confirm('Reset this reading plan? Your progress will be lost.')) return
    const all = loadProgress(); delete all[params.id]; saveProgress(all)
    setProgress(null)
    pushProgress({ planId: params.id, currentDay: 1, completed: false, paused: false, startedAt: new Date().toISOString(), reset: true })
    showToast('Plan reset')
  }

  const todayKey = localDateKey()

  // Parse every day's description once, and group into ordered phases —
  // falls back to a single "All Days" phase if the label format isn't
  // present (older/other plans), so nothing breaks for plans without it.
  const { phases, parsedByDay } = useMemo(() => {
    const parsedByDay = new Map<string, Parsed>()
    const order: string[] = []
    const byPhase = new Map<string, Day[]>()
    for (const day of plan?.days ?? []) {
      const parsed = parseDescription(day.description)
      parsedByDay.set(day.id, parsed)
      const phase = parsed.Phase ?? 'All Days'
      if (!byPhase.has(phase)) { byPhase.set(phase, []); order.push(phase) }
      byPhase.get(phase)!.push(day)
    }
    return { phases: order.map(name => ({ name, days: byPhase.get(name)! })), parsedByDay }
  }, [plan])

  // Default-open the phase containing today's date (or the user's current
  // progress day), falling back to the first phase.
  useEffect(() => {
    if (openPhase || phases.length === 0) return
    let target = phases[0].name
    for (const phase of phases) {
      const hit = phase.days.find(d => {
        const iso = isoDateFrom(parsedByDay.get(d.id)?.Date)
        return iso === todayKey || (progress && d.day_number === progress.currentDay)
      })
      if (hit) { target = phase.name; break }
    }
    setOpenPhase(target)
  }, [phases, parsedByDay, openPhase, progress, todayKey])

  useEffect(() => {
    if (todayRef.current) todayRef.current.scrollIntoView({ block: 'center' })
  }, [openPhase])

  // Deep link support: /reading-plans/{id}?day=today auto-expands today's
  // entry (used by the homepage "Read today's full devotional" CTA), so
  // landing here shows the day's full write-up immediately rather than
  // requiring an extra click to expand it.
  const searchParams = useSearchParams()
  useEffect(() => {
    if (searchParams.get('day') !== 'today' || parsedByDay.size === 0) return
    const todays = (plan?.days ?? []).find(d => isoDateFrom(parsedByDay.get(d.id)?.Date) === todayKey)
    if (todays) setOpenDays(prev => new Set(prev).add(todays.id))
  }, [searchParams, plan, parsedByDay, todayKey])

  const toggleDay = (id: string) => {
    setOpenDays(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      return next
    })
  }

  const pct = plan && progress ? Math.round((progress.currentDay / plan.duration_days) * 100) : 0

  return (
    <div className="min-h-screen bg-cream dark:bg-navy-dark pt-16">
      <Navigation />
      <main className="max-w-3xl mx-auto px-4 py-10">
        <Link href="/reading-plans" className="inline-flex items-center gap-1.5 text-sm text-navy/60 dark:text-cream/60 hover:text-navy dark:text-cream mb-6">
          <ArrowLeft className="w-4 h-4" /> Reading Plans
        </Link>

        {loading && (
          <div className="flex justify-center py-16">
            <div className="w-6 h-6 border-2 border-navy/20 border-t-navy rounded-full animate-spin" />
          </div>
        )}

        {!loading && error === 'not_found' && (
          <div className="text-center py-16 text-navy/50 dark:text-cream/50">
            <BookOpen className="w-10 h-10 mx-auto mb-3 opacity-40" />
            <p>This reading plan doesn&rsquo;t exist or isn&rsquo;t published yet.</p>
          </div>
        )}

        {!loading && error && error !== 'not_found' && (
          <div className="text-center py-16 text-navy/60 dark:text-cream/60">{error}</div>
        )}

        {!loading && !error && plan && (
          <>
            <h1 className="font-display text-3xl font-light text-navy dark:text-cream mb-2">{plan.title}</h1>
            {plan.description && <p className="text-navy/60 dark:text-cream/60 mb-4 leading-relaxed font-body text-sm">{plan.description}</p>}
            <div className="flex items-center gap-3 mb-6 text-sm text-navy/50 dark:text-cream/50 font-body">
              <span className="flex items-center gap-1"><Clock className="w-4 h-4" /> {plan.duration_days} days</span>
              <span className="capitalize px-2 py-0.5 rounded-full bg-navy/6 text-xs font-medium">{plan.difficulty}</span>
            </div>

            {/* Progress / controls */}
            <div className="mb-8 p-5 rounded-2xl bg-white dark:bg-navy-dark border border-navy/8">
              {!progress ? (
                <button onClick={startPlan}
                  className="flex items-center gap-2 px-5 py-2.5 bg-navy hover:bg-navy-light text-white text-sm font-body font-semibold rounded-full transition-colors">
                  <Play className="w-4 h-4" /> Start This Plan
                </button>
              ) : (
                <>
                  <div className="flex items-center justify-between text-xs font-body text-charcoal/45 dark:text-cream/45 mb-1.5">
                    <span>{progress.completed ? 'Completed' : `Day ${progress.currentDay} of ${plan.duration_days}`}</span>
                    <span>{progress.completed ? '100%' : `${pct}%`}</span>
                  </div>
                  <div className="w-full bg-navy/8 rounded-full h-1.5 mb-4">
                    <div className="bg-gold h-1.5 rounded-full transition-all" style={{ width: `${progress.completed ? 100 : pct}%` }} />
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    {!progress.completed && (
                      <button onClick={markDay}
                        className="flex items-center gap-1.5 px-4 py-2 bg-navy hover:bg-navy-light text-white text-xs font-body font-medium rounded-full transition-colors">
                        <Check className="w-3.5 h-3.5" /> Mark Day {progress.currentDay} Complete
                      </button>
                    )}
                    {!progress.completed && (
                      <button onClick={togglePause}
                        className="flex items-center gap-1.5 px-4 py-2 border border-navy/15 text-navy/60 dark:text-cream/60 hover:text-navy dark:text-cream text-xs font-body rounded-full transition-colors">
                        {progress.paused ? <><Play className="w-3.5 h-3.5" /> Resume</> : <><Pause className="w-3.5 h-3.5" /> Pause</>}
                      </button>
                    )}
                    <button onClick={resetPlan}
                      className="flex items-center gap-1.5 px-4 py-2 text-charcoal/35 dark:text-cream/35 hover:text-red-500 text-xs font-body rounded-full transition-colors">
                      <RotateCcw className="w-3.5 h-3.5" /> Reset
                    </button>
                  </div>
                </>
              )}
            </div>

            {plan.days.length === 0 ? (
              <p className="text-navy/50 dark:text-cream/50 text-sm font-body">This plan&rsquo;s daily readings haven&rsquo;t been published yet.</p>
            ) : (
              <div className="space-y-3">
                {phases.map(phase => {
                  const isOpen = openPhase === phase.name
                  return (
                    <div key={phase.name} className="rounded-2xl border border-navy/8 bg-white dark:bg-navy-dark overflow-hidden">
                      <button
                        onClick={() => setOpenPhase(isOpen ? null : phase.name)}
                        className="w-full flex items-center justify-between gap-3 px-5 py-4 text-left"
                        aria-expanded={isOpen}
                      >
                        <div>
                          <h2 className="font-display text-lg text-navy dark:text-cream">{phase.name}</h2>
                          <p className="text-xs text-charcoal/40 dark:text-cream/40 font-body mt-0.5">Days {phase.days[0]?.day_number}–{phase.days[phase.days.length - 1]?.day_number} · {phase.days.length} days</p>
                        </div>
                        <ChevronDown className={`w-4 h-4 text-navy/40 dark:text-cream/40 shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                      </button>

                      {isOpen && (
                        <ul className="border-t border-navy/8 divide-y divide-navy/6">
                          {phase.days.map(day => {
                            const parsed = parsedByDay.get(day.id) ?? {}
                            const iso = isoDateFrom(parsed.Date)
                            const isToday = iso === todayKey
                            const isCurrent = !!progress && day.day_number === progress.currentDay && !progress.completed
                            const dayOpen = openDays.has(day.id)

                            return (
                              <li key={day.id} ref={isToday ? todayRef : undefined}
                                className={isToday ? 'bg-gold/6' : isCurrent ? 'bg-navy/3' : undefined}>
                                <button onClick={() => toggleDay(day.id)} className="w-full flex items-start gap-3 px-5 py-3.5 text-left">
                                  <div className="shrink-0 w-9 text-center">
                                    <span className="block font-display text-sm font-semibold text-navy/60 dark:text-cream/60">{day.day_number}</span>
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap mb-0.5">
                                      {day.title && <h3 className="font-body text-sm font-medium text-navy dark:text-cream">{day.title}</h3>}
                                      {isToday && <span className="text-[10px] font-body font-semibold text-gold-dark bg-gold/15 px-1.5 py-0.5 rounded-full uppercase tracking-wide">Today</span>}
                                      {isCurrent && !isToday && <span className="text-[10px] font-body font-semibold text-navy dark:text-cream bg-navy/10 px-1.5 py-0.5 rounded-full uppercase tracking-wide">Your day</span>}
                                    </div>
                                    {parsed.Date && (
                                      <p className="text-[11px] text-charcoal/35 dark:text-cream/35 font-body flex items-center gap-1 mb-1.5">
                                        <Calendar className="w-3 h-3" /> {parsed.Date}
                                      </p>
                                    )}
                                    <div className="flex flex-wrap gap-1.5">
                                      {day.readings.map(item => (
                                        <span key={item.id} className="px-2 py-0.5 rounded-full bg-navy/5 text-navy/70 dark:text-cream/70 text-xs font-body">
                                          {bookName(item.book_id)} {item.chapter}
                                        </span>
                                      ))}
                                    </div>
                                  </div>
                                  <ChevronDown className={`w-3.5 h-3.5 text-navy/30 dark:text-cream/30 shrink-0 mt-1 transition-transform ${dayOpen ? 'rotate-180' : ''}`} />
                                </button>

                                {dayOpen && (
                                  <div className="px-5 pb-4 pl-[3.25rem] space-y-3">
                                    {parsed['Library Reading'] && (() => {
                                      const href = libraryReadingHref(parsed['Library Reading'])
                                      return (
                                        <div className="flex gap-2">
                                          <BookOpen className="w-3.5 h-3.5 text-navy/40 dark:text-cream/40 shrink-0 mt-0.5" />
                                          <p className="text-xs text-charcoal/60 dark:text-cream/60 font-body leading-relaxed">
                                            <span className="font-medium text-navy/70 dark:text-cream/70">Library Reading —</span>{' '}
                                            {href ? (
                                              <Link href={href} className="text-navy dark:text-cream underline decoration-navy/25 hover:decoration-gold hover:text-gold-dark transition-colors">
                                                {parsed['Library Reading']}
                                              </Link>
                                            ) : parsed['Library Reading']}
                                          </p>
                                        </div>
                                      )
                                    })()}
                                    {parsed['Reflection Prompt'] && (
                                      <div className="flex gap-2">
                                        <MessageSquare className="w-3.5 h-3.5 text-navy/40 dark:text-cream/40 shrink-0 mt-0.5" />
                                        <p className="text-xs text-charcoal/60 dark:text-cream/60 font-body leading-relaxed"><span className="font-medium text-navy/70 dark:text-cream/70">Reflection —</span> {parsed['Reflection Prompt']}</p>
                                      </div>
                                    )}
                                    {parsed['Prayer Focus'] && (
                                      <div className="flex gap-2">
                                        <HeartHandshake className="w-3.5 h-3.5 text-navy/40 dark:text-cream/40 shrink-0 mt-0.5" />
                                        <p className="text-xs text-charcoal/60 dark:text-cream/60 font-body leading-relaxed"><span className="font-medium text-navy/70 dark:text-cream/70">Prayer Focus —</span> {parsed['Prayer Focus']}</p>
                                      </div>
                                    )}
                                    {parsed['Action Step'] && (
                                      <div className="flex gap-2">
                                        <Sparkles className="w-3.5 h-3.5 text-navy/40 dark:text-cream/40 shrink-0 mt-0.5" />
                                        <p className="text-xs text-charcoal/60 dark:text-cream/60 font-body leading-relaxed"><span className="font-medium text-navy/70 dark:text-cream/70">Action Step —</span> {parsed['Action Step']}</p>
                                      </div>
                                    )}
                                    <div className="flex flex-wrap gap-1.5 pt-1">
                                      {day.readings.map(item => (
                                        <Link key={item.id} href={bibleHref(item.book_id, item.chapter)}
                                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-navy text-white hover:bg-navy-light text-[11px] font-body font-medium transition-colors">
                                          Read {bookName(item.book_id)} {item.chapter}
                                        </Link>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </li>
                            )
                          })}
                        </ul>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </>
        )}
      </main>
      <Footer />

      {toast && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 px-5 py-2.5 bg-navy text-white text-sm font-body font-medium rounded-full shadow-xl animate-fade-in" role="status">
          {toast}
        </div>
      )}
    </div>
  )
}
