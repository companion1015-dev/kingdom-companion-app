'use client'
import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { FolderCog, Sun, Tags, BookMarked, CalendarDays, Plus, Trash2, Pencil, X, ChevronDown, ChevronRight, LibraryBig, Upload } from 'lucide-react'
import Navigation from '@/components/layout/Navigation'
import Footer from '@/components/layout/Footer'
import { BOOKS, TRANSLATIONS } from '@/modules/bible/services/mock-data'

// Admin CMS for site content that isn't user-generated: Daily Encouragement,
// Topics, the Devotional Library, and Reading Plans. Each of these already
// had a public read API and a Prisma table, but no way for an admin to
// actually create or edit an entry short of a one-off seed script or a
// raw SQL insert. "Study" (Bible commentary) is deliberately NOT included
// here -- the reader sources that live from a third-party API
// (bible.helloao.org) by design, not from the local, currently-unused
// CommentaryNote table.

type Tab = 'daily' | 'topics' | 'devotionals' | 'reading-plans' | 'books'

// ─── FETCH HELPERS ────────────────────────────────────────────────────────────

async function api(method: string, url: string, body?: unknown) {
  const res = await fetch(url, {
    method, credentials: 'include',
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  })
  const data = await res.json().catch(() => ({}))
  return { ok: res.status < 400 && data.success !== false, status: res.status, data: data.data, message: data.error?.message ?? data.message }
}

async function apiUpload(method: string, url: string, form: FormData) {
  const res = await fetch(url, { method, credentials: 'include', body: form })
  const data = await res.json().catch(() => ({}))
  return { ok: res.status < 400 && data.success !== false, status: res.status, data: data.data, message: data.error?.message ?? data.message }
}

// ─── SHARED UI ────────────────────────────────────────────────────────────────

function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <label className="block">
      <span className="block text-xs font-body font-semibold text-navy/50 dark:text-cream/50 tracking-wider uppercase mb-1.5">{label}</span>
      {children}
      {hint && <span className="block text-xs text-charcoal/35 dark:text-cream/35 font-body mt-1">{hint}</span>}
    </label>
  )
}

const inputCls = 'w-full px-3.5 py-2.5 rounded-xl border border-navy/12 focus:border-gold/40 focus:ring-2 focus:ring-gold/10 text-navy dark:text-cream font-body text-sm outline-none transition-all bg-white dark:bg-navy-dark'

function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={inputCls} />
}
function TextArea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={`${inputCls} resize-none`} />
}
function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={inputCls} />
}

function Card({ children }: { children: React.ReactNode }) {
  return <div className="bg-white dark:bg-navy-dark rounded-2xl border border-navy/8 p-5">{children}</div>
}

function EmptyState({ text }: { text: string }) {
  return <div className="bg-white dark:bg-navy-dark rounded-2xl border border-navy/8 p-10 text-center"><p className="text-charcoal/45 dark:text-cream/45 font-body text-sm">{text}</p></div>
}

function PrimaryButton(props: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button {...props} className={`flex items-center gap-1.5 px-4 py-2 rounded-xl bg-navy hover:bg-navy-light text-white text-sm font-body font-semibold transition-all disabled:opacity-50 ${props.className ?? ''}`} />
}
function GhostButton(props: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button {...props} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-navy/12 text-navy/60 dark:text-cream/60 hover:text-navy dark:text-cream text-xs font-body font-medium transition-all ${props.className ?? ''}`} />
}
function DangerButton(props: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button {...props} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 text-xs font-body font-medium transition-all ${props.className ?? ''}`} />
}

const BOOK_OPTIONS = BOOKS.map(b => ({ id: b.bookId, name: b.name }))

export default function AdminContentPage() {
  const [tab, setTab] = useState<Tab>('daily')
  const [toast, setToast] = useState<string | null>(null)
  const [gateError, setGateError] = useState<string | null>(null)
  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 2500) }

  useEffect(() => {
    fetch('/api/v1/admin/dashboard', { credentials: 'include' }).then(res => {
      if (res.status === 403) setGateError('Administrator access required.')
      if (res.status === 401) setGateError('Please sign in as an administrator.')
    }).catch(() => {})
  }, [])

  const TABS: { id: Tab; label: string; icon: typeof Sun }[] = [
    { id: 'daily',         label: 'Daily Encouragement', icon: Sun },
    { id: 'topics',        label: 'Topics',              icon: Tags },
    { id: 'devotionals',   label: 'Devotionals',         icon: BookMarked },
    { id: 'reading-plans', label: 'Reading Plans',       icon: CalendarDays },
    { id: 'books',         label: 'Books',               icon: LibraryBig },
  ]

  return (
    <div className="min-h-screen bg-cream dark:bg-navy-dark-gradient">
      <Navigation />
      <main className="max-w-4xl mx-auto px-4 py-10">
        <div className="flex items-center gap-3 mb-2">
          <FolderCog className="w-7 h-7 text-navy dark:text-cream" />
          <h1 className="text-3xl font-serif text-navy dark:text-cream">Content</h1>
        </div>
        <div className="flex items-center justify-between mb-8">
          <p className="text-navy/60 dark:text-cream/60">Create and manage Daily Encouragement, Topics, Devotionals, and Reading Plans.</p>
          <Link href="/admin" className="text-xs font-body font-semibold text-navy/50 dark:text-cream/50 hover:text-navy dark:text-cream shrink-0 ml-4">← Admin Dashboard</Link>
        </div>

        {gateError && (
          <Card><p className="text-charcoal/55 dark:text-cream/55 font-body text-sm text-center">{gateError}</p></Card>
        )}

        {!gateError && (
          <>
            <div className="flex gap-1 mb-6 p-1 bg-navy/5 rounded-2xl overflow-x-auto">
              {TABS.map(t => (
                <button key={t.id} onClick={() => setTab(t.id)}
                  className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-body font-semibold whitespace-nowrap transition-all ${tab === t.id ? 'bg-white dark:bg-navy-dark text-navy dark:text-cream shadow-sm' : 'text-charcoal/45 dark:text-cream/45 hover:text-navy dark:text-cream'}`}>
                  <t.icon className="w-3.5 h-3.5" /> {t.label}
                </button>
              ))}
            </div>

            {tab === 'daily'         && <DailyTab showToast={showToast} />}
            {tab === 'topics'        && <TopicsTab showToast={showToast} />}
            {tab === 'devotionals'   && <DevotionalsTab showToast={showToast} />}
            {tab === 'reading-plans' && <ReadingPlansTab showToast={showToast} />}
            {tab === 'books'         && <BooksTab showToast={showToast} />}
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

type ShowToast = (msg: string) => void

// ─── DAILY ENCOURAGEMENT ───────────────────────────────────────────────────────

type DailyEntry = {
  date: string; verse_reference: string; verse_text: string; translation: string
  book_id: string; chapter: number; title: string; reflection: string
  prayer: string; challenge: string; reflection_question: string
}

const EMPTY_DAILY: DailyEntry = {
  date: '', verse_reference: '', verse_text: '', translation: 'BSB', book_id: 'PSA', chapter: 1,
  title: '', reflection: '', prayer: '', challenge: '', reflection_question: '',
}

function DailyTab({ showToast }: { showToast: ShowToast }) {
  const [entries, setEntries] = useState<DailyEntry[] | null>(null)
  const [editing, setEditing] = useState<DailyEntry | null>(null)
  const [isNew,   setIsNew]   = useState(false)
  const [fetchingVerse, setFetchingVerse] = useState(false)

  const load = useCallback(() => {
    api('GET', '/api/v1/admin/content/daily').then(r => { if (r.ok) setEntries(r.data) })
  }, [])
  useEffect(() => { load() }, [load])

  const openNew = () => {
    const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10)
    setEditing({ ...EMPTY_DAILY, date: tomorrow }); setIsNew(true)
  }

  const fetchVerseText = async () => {
    if (!editing) return
    setFetchingVerse(true)
    const r = await api('GET', `/api/v1/bible/chapter/${editing.translation}/${editing.book_id}/${editing.chapter}`)
    setFetchingVerse(false)
    if (r.ok && r.data?.verses?.length) {
      const v = r.data.verses[0]
      setEditing({ ...editing, verse_reference: v.reference, verse_text: v.text })
      showToast(`Fetched ${v.reference}. Adjust the verse number in the reference if needed.`)
    } else showToast('Could not fetch that chapter. Check the book/chapter/translation.')
  }

  const save = async () => {
    if (!editing) return
    const r = isNew
      ? await api('POST', '/api/v1/admin/content/daily', editing)
      : await api('PATCH', `/api/v1/admin/content/daily/${editing.date}`, editing)
    if (r.ok) { showToast(isNew ? 'Entry created.' : 'Entry updated.'); setEditing(null); load() }
    else showToast(r.message ?? 'Save failed.')
  }

  const remove = async (date: string) => {
    const r = await api('DELETE', `/api/v1/admin/content/daily/${date}`)
    if (r.ok) { showToast('Entry deleted.'); load() } else showToast(r.message ?? 'Delete failed.')
  }

  return (
    <div>
      <div className="flex justify-end mb-4">
        <PrimaryButton onClick={openNew}><Plus className="w-3.5 h-3.5" /> New Entry</PrimaryButton>
      </div>

      {editing && (
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display text-base font-semibold text-navy dark:text-cream">{isNew ? 'New Daily Encouragement' : `Editing ${editing.date}`}</h3>
            <button onClick={() => setEditing(null)} className="text-charcoal/40 dark:text-cream/40 hover:text-navy dark:text-cream"><X className="w-4 h-4" /></button>
          </div>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <Field label="Date">
              <TextInput type="date" value={editing.date} disabled={!isNew} onChange={e => setEditing({ ...editing, date: e.target.value })} />
            </Field>
            <Field label="Title">
              <TextInput value={editing.title} onChange={e => setEditing({ ...editing, title: e.target.value })} />
            </Field>
          </div>
          <div className="grid grid-cols-4 gap-3 mb-3">
            <Field label="Book">
              <Select value={editing.book_id} onChange={e => setEditing({ ...editing, book_id: e.target.value })}>
                {BOOK_OPTIONS.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
              </Select>
            </Field>
            <Field label="Chapter">
              <TextInput type="number" min={1} value={editing.chapter} onChange={e => setEditing({ ...editing, chapter: Number(e.target.value) })} />
            </Field>
            <Field label="Translation">
              <Select value={editing.translation} onChange={e => setEditing({ ...editing, translation: e.target.value })}>
                {TRANSLATIONS.map(t => <option key={t.code} value={t.code}>{t.code}</option>)}
              </Select>
            </Field>
            <div className="flex items-end">
              <GhostButton type="button" onClick={fetchVerseText} disabled={fetchingVerse} className="w-full justify-center">
                {fetchingVerse ? 'Fetching…' : 'Fetch Verse 1'}
              </GhostButton>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <Field label="Verse Reference" hint="e.g. Psalm 46:1 — edit after fetching if you meant a different verse">
              <TextInput value={editing.verse_reference} onChange={e => setEditing({ ...editing, verse_reference: e.target.value })} />
            </Field>
            <Field label="Verse Text">
              <TextInput value={editing.verse_text} onChange={e => setEditing({ ...editing, verse_text: e.target.value })} />
            </Field>
          </div>
          <div className="mb-3"><Field label="Reflection"><TextArea rows={3} value={editing.reflection} onChange={e => setEditing({ ...editing, reflection: e.target.value })} /></Field></div>
          <div className="mb-3"><Field label="Prayer"><TextArea rows={2} value={editing.prayer} onChange={e => setEditing({ ...editing, prayer: e.target.value })} /></Field></div>
          <div className="grid grid-cols-2 gap-3 mb-4">
            <Field label="Challenge"><TextInput value={editing.challenge} onChange={e => setEditing({ ...editing, challenge: e.target.value })} /></Field>
            <Field label="Reflection Question"><TextInput value={editing.reflection_question} onChange={e => setEditing({ ...editing, reflection_question: e.target.value })} /></Field>
          </div>
          <PrimaryButton onClick={save}>{isNew ? 'Create' : 'Save Changes'}</PrimaryButton>
        </Card>
      )}

      <div className="space-y-2 mt-4">
        {entries === null && <p className="text-sm text-charcoal/40 dark:text-cream/40 font-body">Loading…</p>}
        {entries?.length === 0 && <EmptyState text="No daily encouragement entries yet — they're generated automatically each day, or you can add one ahead of time above." />}
        {entries?.map(e => (
          <div key={e.date} className="bg-white dark:bg-navy-dark rounded-2xl border border-navy/8 p-4 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm font-body font-semibold text-navy dark:text-cream truncate">{e.date} — {e.title}</p>
              <p className="text-xs text-charcoal/45 dark:text-cream/45 font-body truncate">{e.verse_reference}</p>
            </div>
            <div className="flex gap-2 shrink-0">
              <GhostButton onClick={() => { setEditing(e); setIsNew(false) }}><Pencil className="w-3.5 h-3.5" /> Edit</GhostButton>
              <DangerButton onClick={() => remove(e.date)}><Trash2 className="w-3.5 h-3.5" /> Delete</DangerButton>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── DEVOTIONALS ────────────────────────────────────────────────────────────

type SeriesRow = { id: string; slug: string; title: string; category: string; description: string | null; duration_days: number; is_published: boolean; _count?: { entries: number } }
type DevotionalEntryRow = {
  id: string; day_number: number; title: string; theme: string | null
  translation_id: string; book_id: string; chapter: number
  central_verse_id: string; central_verse_reference: string
  reflection: string; guided_prayer: string; practical_application: string | null
  is_ai_generated: boolean; ai_disclosure_text: string | null
}

const EMPTY_SERIES: SeriesRow = { id: '', slug: '', title: '', category: '', description: '', duration_days: 7, is_published: true }
const EMPTY_ENTRY: DevotionalEntryRow = {
  id: '', day_number: 1, title: '', theme: '', translation_id: 'BSB', book_id: 'PSA', chapter: 1,
  central_verse_id: '', central_verse_reference: '', reflection: '', guided_prayer: '',
  practical_application: '', is_ai_generated: false, ai_disclosure_text: '',
}

function DevotionalsTab({ showToast }: { showToast: ShowToast }) {
  const [series,   setSeries]   = useState<SeriesRow[] | null>(null)
  const [editing,  setEditing]  = useState<SeriesRow | null>(null)
  const [isNew,    setIsNew]    = useState(false)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [entries,  setEntries]  = useState<DevotionalEntryRow[]>([])
  const [entryForm, setEntryForm] = useState<DevotionalEntryRow | null>(null)
  const [entryIsNew, setEntryIsNew] = useState(false)

  const load = useCallback(() => {
    api('GET', '/api/v1/admin/content/devotionals').then(r => { if (r.ok) setSeries(r.data) })
  }, [])
  useEffect(() => { load() }, [load])

  const toggleExpand = async (id: string) => {
    if (expanded === id) { setExpanded(null); return }
    const r = await api('GET', `/api/v1/admin/content/devotionals/${id}`)
    if (r.ok) { setEntries(r.data.entries); setExpanded(id) }
  }

  const saveSeries = async () => {
    if (!editing) return
    const r = isNew
      ? await api('POST', '/api/v1/admin/content/devotionals', editing)
      : await api('PATCH', `/api/v1/admin/content/devotionals/${editing.id}`, editing)
    if (r.ok) { showToast(isNew ? 'Series created.' : 'Series updated.'); setEditing(null); load() }
    else showToast(r.message ?? 'Save failed.')
  }

  const removeSeries = async (id: string) => {
    const r = await api('DELETE', `/api/v1/admin/content/devotionals/${id}`)
    if (r.ok) { showToast('Series deleted.'); if (expanded === id) setExpanded(null); load() } else showToast(r.message ?? 'Delete failed.')
  }

  const saveEntry = async (seriesId: string) => {
    if (!entryForm) return
    const r = entryIsNew
      ? await api('POST', `/api/v1/admin/content/devotionals/${seriesId}/entries`, entryForm)
      : await api('PATCH', `/api/v1/admin/content/devotionals/${seriesId}/entries/${entryForm.id}`, entryForm)
    if (r.ok) {
      showToast(entryIsNew ? 'Entry added.' : 'Entry updated.'); setEntryForm(null)
      const refreshed = await api('GET', `/api/v1/admin/content/devotionals/${seriesId}`)
      if (refreshed.ok) { setEntries(refreshed.data.entries); load() }
    } else showToast(r.message ?? 'Save failed.')
  }

  const removeEntry = async (seriesId: string, entryId: string) => {
    const r = await api('DELETE', `/api/v1/admin/content/devotionals/${seriesId}/entries/${entryId}`)
    if (r.ok) { showToast('Entry deleted.'); setEntries(entries.filter(e => e.id !== entryId)); load() } else showToast(r.message ?? 'Delete failed.')
  }

  return (
    <div>
      <div className="flex justify-end mb-4">
        <PrimaryButton onClick={() => { setEditing({ ...EMPTY_SERIES }); setIsNew(true) }}><Plus className="w-3.5 h-3.5" /> New Series</PrimaryButton>
      </div>

      {editing && (
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display text-base font-semibold text-navy dark:text-cream">{isNew ? 'New Devotional Series' : `Editing "${editing.title}"`}</h3>
            <button onClick={() => setEditing(null)} className="text-charcoal/40 dark:text-cream/40 hover:text-navy dark:text-cream"><X className="w-4 h-4" /></button>
          </div>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <Field label="Title"><TextInput value={editing.title} onChange={e => setEditing({ ...editing, title: e.target.value })} /></Field>
            <Field label="Slug"><TextInput value={editing.slug} onChange={e => setEditing({ ...editing, slug: e.target.value })} /></Field>
          </div>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <Field label="Category"><TextInput value={editing.category} onChange={e => setEditing({ ...editing, category: e.target.value })} /></Field>
            <Field label="Duration (days)"><TextInput type="number" min={1} value={editing.duration_days} onChange={e => setEditing({ ...editing, duration_days: Number(e.target.value) })} /></Field>
          </div>
          <div className="mb-3"><Field label="Description"><TextArea rows={2} value={editing.description ?? ''} onChange={e => setEditing({ ...editing, description: e.target.value })} /></Field></div>
          <label className="flex items-center gap-2 mb-4 text-sm font-body text-navy dark:text-cream">
            <input type="checkbox" checked={editing.is_published} onChange={e => setEditing({ ...editing, is_published: e.target.checked })} /> Published
          </label>
          <PrimaryButton onClick={saveSeries}>{isNew ? 'Create' : 'Save Changes'}</PrimaryButton>
        </Card>
      )}

      <div className="space-y-2 mt-4">
        {series === null && <p className="text-sm text-charcoal/40 dark:text-cream/40 font-body">Loading…</p>}
        {series?.length === 0 && <EmptyState text="No devotional series yet." />}
        {series?.map(s => (
          <div key={s.id} className="bg-white dark:bg-navy-dark rounded-2xl border border-navy/8 overflow-hidden">
            <div className="p-4 flex items-center justify-between gap-3">
              <button onClick={() => toggleExpand(s.id)} className="flex items-center gap-2 min-w-0 text-left flex-1">
                {expanded === s.id ? <ChevronDown className="w-4 h-4 shrink-0 text-navy/40 dark:text-cream/40" /> : <ChevronRight className="w-4 h-4 shrink-0 text-navy/40 dark:text-cream/40" />}
                <div className="min-w-0">
                  <p className="text-sm font-body font-semibold text-navy dark:text-cream truncate">
                    {s.title} {!s.is_published && <span className="text-xs text-charcoal/35 dark:text-cream/35 font-normal">(draft)</span>}
                  </p>
                  <p className="text-xs text-charcoal/45 dark:text-cream/45 font-body truncate">{s.category} · {s._count?.entries ?? 0}/{s.duration_days} days</p>
                </div>
              </button>
              <div className="flex gap-2 shrink-0">
                <GhostButton onClick={() => { setEditing(s); setIsNew(false) }}><Pencil className="w-3.5 h-3.5" /> Edit</GhostButton>
                <DangerButton onClick={() => removeSeries(s.id)}><Trash2 className="w-3.5 h-3.5" /> Delete</DangerButton>
              </div>
            </div>

            {expanded === s.id && (
              <div className="border-t border-navy/8 p-4 bg-cream/40 dark:bg-navy-dark/40">
                <div className="flex justify-end mb-3">
                  <GhostButton onClick={() => { setEntryForm({ ...EMPTY_ENTRY, day_number: entries.length + 1 }); setEntryIsNew(true) }}>
                    <Plus className="w-3.5 h-3.5" /> Add Day
                  </GhostButton>
                </div>

                {entryForm && (
                  <Card>
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-display text-sm font-semibold text-navy dark:text-cream">{entryIsNew ? 'New Day' : `Editing Day ${entryForm.day_number}`}</h4>
                      <button onClick={() => setEntryForm(null)} className="text-charcoal/40 dark:text-cream/40 hover:text-navy dark:text-cream"><X className="w-4 h-4" /></button>
                    </div>
                    <div className="grid grid-cols-3 gap-3 mb-3">
                      <Field label="Day #"><TextInput type="number" min={1} value={entryForm.day_number} onChange={e => setEntryForm({ ...entryForm, day_number: Number(e.target.value) })} /></Field>
                      <Field label="Title"><TextInput value={entryForm.title} onChange={e => setEntryForm({ ...entryForm, title: e.target.value })} /></Field>
                      <Field label="Theme"><TextInput value={entryForm.theme ?? ''} onChange={e => setEntryForm({ ...entryForm, theme: e.target.value })} /></Field>
                    </div>
                    <div className="grid grid-cols-4 gap-3 mb-3">
                      <Field label="Book">
                        <Select value={entryForm.book_id} onChange={e => setEntryForm({ ...entryForm, book_id: e.target.value })}>
                          {BOOK_OPTIONS.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                        </Select>
                      </Field>
                      <Field label="Chapter"><TextInput type="number" min={1} value={entryForm.chapter} onChange={e => setEntryForm({ ...entryForm, chapter: Number(e.target.value) })} /></Field>
                      <Field label="Translation">
                        <Select value={entryForm.translation_id} onChange={e => setEntryForm({ ...entryForm, translation_id: e.target.value })}>
                          {TRANSLATIONS.map(t => <option key={t.code} value={t.code}>{t.code}</option>)}
                        </Select>
                      </Field>
                      <Field label="Central Verse Ref" hint="e.g. Psalm 46:1">
                        <TextInput value={entryForm.central_verse_reference} onChange={e => setEntryForm({ ...entryForm, central_verse_reference: e.target.value, central_verse_id: entryForm.central_verse_id || `${entryForm.book_id}.${entryForm.chapter}.${e.target.value.split(':').pop()?.trim() ?? 1}` })} />
                      </Field>
                    </div>
                    <div className="mb-3"><Field label="Reflection"><TextArea rows={3} value={entryForm.reflection} onChange={e => setEntryForm({ ...entryForm, reflection: e.target.value })} /></Field></div>
                    <div className="mb-3"><Field label="Guided Prayer"><TextArea rows={2} value={entryForm.guided_prayer} onChange={e => setEntryForm({ ...entryForm, guided_prayer: e.target.value })} /></Field></div>
                    <div className="mb-4"><Field label="Practical Application"><TextArea rows={2} value={entryForm.practical_application ?? ''} onChange={e => setEntryForm({ ...entryForm, practical_application: e.target.value })} /></Field></div>
                    <PrimaryButton onClick={() => saveEntry(s.id)}>{entryIsNew ? 'Add Day' : 'Save Changes'}</PrimaryButton>
                  </Card>
                )}

                <div className="space-y-2 mt-3">
                  {entries.length === 0 && <p className="text-xs text-charcoal/35 dark:text-cream/35 font-body">No days added yet.</p>}
                  {entries.map(e => (
                    <div key={e.id} className="bg-white dark:bg-navy-dark rounded-xl border border-navy/8 p-3 flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-body font-semibold text-navy dark:text-cream truncate">Day {e.day_number} — {e.title}</p>
                        <p className="text-xs text-charcoal/45 dark:text-cream/45 font-body truncate">{e.central_verse_reference}</p>
                      </div>
                      <div className="flex gap-2 shrink-0">
                        <GhostButton onClick={() => { setEntryForm(e); setEntryIsNew(false) }}><Pencil className="w-3.5 h-3.5" /></GhostButton>
                        <DangerButton onClick={() => removeEntry(s.id, e.id)}><Trash2 className="w-3.5 h-3.5" /></DangerButton>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── READING PLANS ──────────────────────────────────────────────────────────

type PlanRow = { id: string; title: string; description: string | null; duration_days: number; difficulty: string; is_published: boolean; _count?: { days: number } }
type ReadingItemRow = { book_id: string; chapter: number; sort_order?: number }
type PlanDayRow = { id: string; day_number: number; title: string | null; description: string | null; readings: ReadingItemRow[] }

const EMPTY_PLAN: PlanRow = { id: '', title: '', description: '', duration_days: 30, difficulty: 'beginner', is_published: false }
const EMPTY_DAY: { day_number: number; title: string; description: string; readings: ReadingItemRow[] } = {
  day_number: 1, title: '', description: '', readings: [{ book_id: 'PSA', chapter: 1 }],
}

function ReadingPlansTab({ showToast }: { showToast: ShowToast }) {
  const [plans,    setPlans]    = useState<PlanRow[] | null>(null)
  const [editing,  setEditing]  = useState<PlanRow | null>(null)
  const [isNew,    setIsNew]    = useState(false)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [days,     setDays]     = useState<PlanDayRow[]>([])
  const [dayForm,  setDayForm]  = useState<typeof EMPTY_DAY & { id?: string } | null>(null)
  const [dayIsNew, setDayIsNew] = useState(false)

  const load = useCallback(() => {
    api('GET', '/api/v1/admin/content/reading-plans').then(r => { if (r.ok) setPlans(r.data) })
  }, [])
  useEffect(() => { load() }, [load])

  const toggleExpand = async (id: string) => {
    if (expanded === id) { setExpanded(null); return }
    const r = await api('GET', `/api/v1/admin/content/reading-plans/${id}`)
    if (r.ok) { setDays(r.data.days); setExpanded(id) }
  }

  const savePlan = async () => {
    if (!editing) return
    const r = isNew
      ? await api('POST', '/api/v1/admin/content/reading-plans', editing)
      : await api('PATCH', `/api/v1/admin/content/reading-plans/${editing.id}`, editing)
    if (r.ok) { showToast(isNew ? 'Plan created.' : 'Plan updated.'); setEditing(null); load() }
    else showToast(r.message ?? 'Save failed.')
  }

  const removePlan = async (id: string) => {
    const r = await api('DELETE', `/api/v1/admin/content/reading-plans/${id}`)
    if (r.ok) { showToast('Plan deleted.'); if (expanded === id) setExpanded(null); load() } else showToast(r.message ?? 'Delete failed.')
  }

  const saveDay = async (planId: string) => {
    if (!dayForm) return
    const r = dayIsNew
      ? await api('POST', `/api/v1/admin/content/reading-plans/${planId}/days`, dayForm)
      : await api('PATCH', `/api/v1/admin/content/reading-plans/${planId}/days/${dayForm.id}`, dayForm)
    if (r.ok) {
      showToast(dayIsNew ? 'Day added.' : 'Day updated.'); setDayForm(null)
      const refreshed = await api('GET', `/api/v1/admin/content/reading-plans/${planId}`)
      if (refreshed.ok) { setDays(refreshed.data.days); load() }
    } else showToast(r.message ?? 'Save failed.')
  }

  const removeDay = async (planId: string, dayId: string) => {
    const r = await api('DELETE', `/api/v1/admin/content/reading-plans/${planId}/days/${dayId}`)
    if (r.ok) { showToast('Day deleted.'); setDays(days.filter(d => d.id !== dayId)); load() } else showToast(r.message ?? 'Delete failed.')
  }

  const setReading = (i: number, patch: Partial<ReadingItemRow>) => {
    if (!dayForm) return
    setDayForm({ ...dayForm, readings: dayForm.readings.map((r, idx) => idx === i ? { ...r, ...patch } : r) })
  }
  const addReading    = () => dayForm && setDayForm({ ...dayForm, readings: [...dayForm.readings, { book_id: 'PSA', chapter: 1 }] })
  const removeReading  = (i: number) => dayForm && setDayForm({ ...dayForm, readings: dayForm.readings.filter((_, idx) => idx !== i) })

  return (
    <div>
      <div className="flex justify-end mb-4">
        <PrimaryButton onClick={() => { setEditing({ ...EMPTY_PLAN }); setIsNew(true) }}><Plus className="w-3.5 h-3.5" /> New Plan</PrimaryButton>
      </div>

      {editing && (
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display text-base font-semibold text-navy dark:text-cream">{isNew ? 'New Reading Plan' : `Editing "${editing.title}"`}</h3>
            <button onClick={() => setEditing(null)} className="text-charcoal/40 dark:text-cream/40 hover:text-navy dark:text-cream"><X className="w-4 h-4" /></button>
          </div>
          <div className="mb-3"><Field label="Title"><TextInput value={editing.title} onChange={e => setEditing({ ...editing, title: e.target.value })} /></Field></div>
          <div className="mb-3"><Field label="Description"><TextArea rows={2} value={editing.description ?? ''} onChange={e => setEditing({ ...editing, description: e.target.value })} /></Field></div>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <Field label="Duration (days)"><TextInput type="number" min={1} value={editing.duration_days} onChange={e => setEditing({ ...editing, duration_days: Number(e.target.value) })} /></Field>
            <Field label="Difficulty">
              <Select value={editing.difficulty} onChange={e => setEditing({ ...editing, difficulty: e.target.value })}>
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </Select>
            </Field>
          </div>
          <label className="flex items-center gap-2 mb-4 text-sm font-body text-navy dark:text-cream">
            <input type="checkbox" checked={editing.is_published} onChange={e => setEditing({ ...editing, is_published: e.target.checked })} />
            Published <span className="text-xs text-charcoal/35 dark:text-cream/35 font-normal">— add all days before publishing</span>
          </label>
          <PrimaryButton onClick={savePlan}>{isNew ? 'Create' : 'Save Changes'}</PrimaryButton>
        </Card>
      )}

      <div className="space-y-2 mt-4">
        {plans === null && <p className="text-sm text-charcoal/40 dark:text-cream/40 font-body">Loading…</p>}
        {plans?.length === 0 && <EmptyState text="No reading plans yet." />}
        {plans?.map(p => (
          <div key={p.id} className="bg-white dark:bg-navy-dark rounded-2xl border border-navy/8 overflow-hidden">
            <div className="p-4 flex items-center justify-between gap-3">
              <button onClick={() => toggleExpand(p.id)} className="flex items-center gap-2 min-w-0 text-left flex-1">
                {expanded === p.id ? <ChevronDown className="w-4 h-4 shrink-0 text-navy/40 dark:text-cream/40" /> : <ChevronRight className="w-4 h-4 shrink-0 text-navy/40 dark:text-cream/40" />}
                <div className="min-w-0">
                  <p className="text-sm font-body font-semibold text-navy dark:text-cream truncate">
                    {p.title} {!p.is_published && <span className="text-xs text-charcoal/35 dark:text-cream/35 font-normal">(draft)</span>}
                  </p>
                  <p className="text-xs text-charcoal/45 dark:text-cream/45 font-body truncate capitalize">{p.difficulty} · {p._count?.days ?? 0}/{p.duration_days} days</p>
                </div>
              </button>
              <div className="flex gap-2 shrink-0">
                <GhostButton onClick={() => { setEditing(p); setIsNew(false) }}><Pencil className="w-3.5 h-3.5" /> Edit</GhostButton>
                <DangerButton onClick={() => removePlan(p.id)}><Trash2 className="w-3.5 h-3.5" /> Delete</DangerButton>
              </div>
            </div>

            {expanded === p.id && (
              <div className="border-t border-navy/8 p-4 bg-cream/40 dark:bg-navy-dark/40">
                <div className="flex justify-end mb-3">
                  <GhostButton onClick={() => { setDayForm({ ...EMPTY_DAY, day_number: days.length + 1, readings: [{ book_id: 'PSA', chapter: 1 }] }); setDayIsNew(true) }}>
                    <Plus className="w-3.5 h-3.5" /> Add Day
                  </GhostButton>
                </div>

                {dayForm && (
                  <Card>
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-display text-sm font-semibold text-navy dark:text-cream">{dayIsNew ? 'New Day' : `Editing Day ${dayForm.day_number}`}</h4>
                      <button onClick={() => setDayForm(null)} className="text-charcoal/40 dark:text-cream/40 hover:text-navy dark:text-cream"><X className="w-4 h-4" /></button>
                    </div>
                    <div className="grid grid-cols-2 gap-3 mb-3">
                      <Field label="Day #">
                        <TextInput type="number" min={1} value={dayForm.day_number} disabled={!dayIsNew} onChange={e => setDayForm({ ...dayForm, day_number: Number(e.target.value) })} />
                      </Field>
                      <Field label="Title (optional)"><TextInput value={dayForm.title} onChange={e => setDayForm({ ...dayForm, title: e.target.value })} /></Field>
                    </div>
                    <div className="mb-3"><Field label="Description (optional)"><TextArea rows={2} value={dayForm.description} onChange={e => setDayForm({ ...dayForm, description: e.target.value })} /></Field></div>

                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-body font-semibold text-navy/50 dark:text-cream/50 tracking-wider uppercase">Readings</span>
                      <GhostButton type="button" onClick={addReading}><Plus className="w-3 h-3" /> Add Reading</GhostButton>
                    </div>
                    <div className="space-y-2 mb-4">
                      {dayForm.readings.map((r, i) => (
                        <div key={i} className="grid grid-cols-[1fr_1fr_auto] gap-2 items-center">
                          <Select value={r.book_id} onChange={e => setReading(i, { book_id: e.target.value })}>
                            {BOOK_OPTIONS.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                          </Select>
                          <TextInput type="number" min={1} placeholder="Chapter" value={r.chapter} onChange={e => setReading(i, { chapter: Number(e.target.value) })} />
                          <button onClick={() => removeReading(i)} className="text-charcoal/30 dark:text-cream/30 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                        </div>
                      ))}
                    </div>

                    <PrimaryButton onClick={() => saveDay(p.id)}>{dayIsNew ? 'Add Day' : 'Save Changes'}</PrimaryButton>
                  </Card>
                )}

                <div className="space-y-2 mt-3">
                  {days.length === 0 && <p className="text-xs text-charcoal/35 dark:text-cream/35 font-body">No days added yet.</p>}
                  {days.map(d => (
                    <div key={d.id} className="bg-white dark:bg-navy-dark rounded-xl border border-navy/8 p-3 flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-body font-semibold text-navy dark:text-cream truncate">Day {d.day_number}{d.title ? ` — ${d.title}` : ''}</p>
                        <p className="text-xs text-charcoal/45 dark:text-cream/45 font-body truncate">{d.readings.map(r => `${r.book_id} ${r.chapter}`).join(', ')}</p>
                      </div>
                      <div className="flex gap-2 shrink-0">
                        <GhostButton onClick={() => { setDayForm({ id: d.id, day_number: d.day_number, title: d.title ?? '', description: d.description ?? '', readings: d.readings }); setDayIsNew(false) }}><Pencil className="w-3.5 h-3.5" /></GhostButton>
                        <DangerButton onClick={() => removeDay(p.id, d.id)}><Trash2 className="w-3.5 h-3.5" /></DangerButton>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── TOPICS ─────────────────────────────────────────────────────────────────

type TopicVerseRow = { translation_id: string; book_id: string; chapter: number; verse_id: string; verse_reference: string; display_order?: number }
type TopicRow = { id: string; slug: string; name: string; category: string; description: string; is_published: boolean; _count?: { verses: number } }
type TopicDetail = TopicRow & { verses: TopicVerseRow[] }

const EMPTY_TOPIC: TopicDetail = { id: '', slug: '', name: '', category: '', description: '', is_published: true, verses: [] }
const EMPTY_VERSE: TopicVerseRow = { translation_id: 'BSB', book_id: 'PSA', chapter: 1, verse_id: '', verse_reference: '' }

function TopicsTab({ showToast }: { showToast: ShowToast }) {
  const [topics,  setTopics]  = useState<TopicRow[] | null>(null)
  const [editing, setEditing] = useState<TopicDetail | null>(null)
  const [isNew,   setIsNew]   = useState(false)

  const load = useCallback(() => {
    api('GET', '/api/v1/admin/content/topics').then(r => { if (r.ok) setTopics(r.data) })
  }, [])
  useEffect(() => { load() }, [load])

  const openEdit = async (id: string) => {
    const r = await api('GET', `/api/v1/admin/content/topics/${id}`)
    if (r.ok) { setEditing(r.data); setIsNew(false) }
  }

  const save = async () => {
    if (!editing) return
    const r = isNew
      ? await api('POST', '/api/v1/admin/content/topics', editing)
      : await api('PATCH', `/api/v1/admin/content/topics/${editing.id}`, editing)
    if (r.ok) { showToast(isNew ? 'Topic created.' : 'Topic updated.'); setEditing(null); load() }
    else showToast(r.message ?? 'Save failed.')
  }

  const remove = async (id: string) => {
    const r = await api('DELETE', `/api/v1/admin/content/topics/${id}`)
    if (r.ok) { showToast('Topic deleted.'); load() } else showToast(r.message ?? 'Delete failed.')
  }

  const setVerse = (i: number, patch: Partial<TopicVerseRow>) => {
    if (!editing) return
    const verses = editing.verses.map((v, idx) => idx === i ? { ...v, ...patch } : v)
    setEditing({ ...editing, verses })
  }
  const addVerse    = () => editing && setEditing({ ...editing, verses: [...editing.verses, { ...EMPTY_VERSE }] })
  const removeVerse  = (i: number) => editing && setEditing({ ...editing, verses: editing.verses.filter((_, idx) => idx !== i) })

  return (
    <div>
      <div className="flex justify-end mb-4">
        <PrimaryButton onClick={() => { setEditing({ ...EMPTY_TOPIC }); setIsNew(true) }}><Plus className="w-3.5 h-3.5" /> New Topic</PrimaryButton>
      </div>

      {editing && (
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display text-base font-semibold text-navy dark:text-cream">{isNew ? 'New Topic' : `Editing "${editing.name}"`}</h3>
            <button onClick={() => setEditing(null)} className="text-charcoal/40 dark:text-cream/40 hover:text-navy dark:text-cream"><X className="w-4 h-4" /></button>
          </div>
          <div className="grid grid-cols-3 gap-3 mb-3">
            <Field label="Name"><TextInput value={editing.name} onChange={e => setEditing({ ...editing, name: e.target.value })} /></Field>
            <Field label="Slug" hint="lowercase-with-dashes"><TextInput value={editing.slug} onChange={e => setEditing({ ...editing, slug: e.target.value })} /></Field>
            <Field label="Category"><TextInput value={editing.category} onChange={e => setEditing({ ...editing, category: e.target.value })} /></Field>
          </div>
          <div className="mb-3"><Field label="Description"><TextArea rows={2} value={editing.description} onChange={e => setEditing({ ...editing, description: e.target.value })} /></Field></div>
          <label className="flex items-center gap-2 mb-4 text-sm font-body text-navy dark:text-cream">
            <input type="checkbox" checked={editing.is_published} onChange={e => setEditing({ ...editing, is_published: e.target.checked })} /> Published
          </label>

          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-body font-semibold text-navy/50 dark:text-cream/50 tracking-wider uppercase">Verses</span>
            <GhostButton type="button" onClick={addVerse}><Plus className="w-3 h-3" /> Add Verse</GhostButton>
          </div>
          <div className="space-y-2 mb-4">
            {editing.verses.map((v, i) => (
              <div key={i} className="grid grid-cols-[1fr_1fr_1fr_2fr_auto] gap-2 items-center">
                <Select value={v.translation_id} onChange={e => setVerse(i, { translation_id: e.target.value })}>
                  {TRANSLATIONS.map(t => <option key={t.code} value={t.code}>{t.code}</option>)}
                </Select>
                <Select value={v.book_id} onChange={e => setVerse(i, { book_id: e.target.value })}>
                  {BOOK_OPTIONS.map(b => <option key={b.id} value={b.id}>{b.id}</option>)}
                </Select>
                <TextInput type="number" min={1} placeholder="Ch." value={v.chapter} onChange={e => setVerse(i, { chapter: Number(e.target.value) })} />
                <TextInput placeholder="Reference e.g. John 3:16" value={v.verse_reference} onChange={e => setVerse(i, { verse_reference: e.target.value, verse_id: v.verse_id || `${v.book_id}.${v.chapter}.${e.target.value.split(':').pop()?.trim() ?? 1}` })} />
                <button onClick={() => removeVerse(i)} className="text-charcoal/30 dark:text-cream/30 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
              </div>
            ))}
            {editing.verses.length === 0 && <p className="text-xs text-charcoal/35 dark:text-cream/35 font-body">No verses yet.</p>}
          </div>

          <PrimaryButton onClick={save}>{isNew ? 'Create' : 'Save Changes'}</PrimaryButton>
        </Card>
      )}

      <div className="space-y-2 mt-4">
        {topics === null && <p className="text-sm text-charcoal/40 dark:text-cream/40 font-body">Loading…</p>}
        {topics?.length === 0 && <EmptyState text="No topics yet." />}
        {topics?.map(t => (
          <div key={t.id} className="bg-white dark:bg-navy-dark rounded-2xl border border-navy/8 p-4 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm font-body font-semibold text-navy dark:text-cream truncate">
                {t.name} {!t.is_published && <span className="text-xs text-charcoal/35 dark:text-cream/35 font-normal">(draft)</span>}
              </p>
              <p className="text-xs text-charcoal/45 dark:text-cream/45 font-body truncate">{t.category} · {t._count?.verses ?? 0} verses</p>
            </div>
            <div className="flex gap-2 shrink-0">
              <GhostButton onClick={() => openEdit(t.id)}><Pencil className="w-3.5 h-3.5" /> Edit</GhostButton>
              <DangerButton onClick={() => remove(t.id)}><Trash2 className="w-3.5 h-3.5" /> Delete</DangerButton>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── BOOKS ──────────────────────────────────────────────────────────────────
// The one tab that's a real file upload from the admin's own computer,
// not typed-in text -- reuses R2 storage the same way Prayer Wall
// attachments do (src/lib/storage/attachments.ts), via a multipart request.

type LibraryBookRow = {
  id: string; title: string; author_name: string; description: string | null
  cover_image_url: string | null; file_url: string; file_type: string
  file_size_bytes: number | null; is_published: boolean
}

function BooksTab({ showToast }: { showToast: ShowToast }) {
  const [books,   setBooks]   = useState<LibraryBookRow[] | null>(null)
  const [showNew, setShowNew] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)

  const [title,        setTitle]        = useState('')
  const [authorName,   setAuthorName]   = useState('')
  const [description,  setDescription]  = useState('')
  const [isPublished,  setIsPublished]  = useState(true)
  const [file,         setFile]         = useState<File | null>(null)
  const [coverImage,   setCoverImage]   = useState<File | null>(null)

  const load = useCallback(() => {
    api('GET', '/api/v1/admin/content/books').then(r => { if (r.ok) setBooks(r.data) })
  }, [])
  useEffect(() => { load() }, [load])

  const resetForm = () => {
    setTitle(''); setAuthorName(''); setDescription(''); setIsPublished(true); setFile(null); setCoverImage(null)
    setShowNew(false); setEditingId(null)
  }

  const startEdit = (b: LibraryBookRow) => {
    setTitle(b.title); setAuthorName(b.author_name); setDescription(b.description ?? '')
    setIsPublished(b.is_published); setFile(null); setCoverImage(null)
    setEditingId(b.id); setShowNew(true)
  }

  const submit = async () => {
    if (!title.trim() || !authorName.trim()) { showToast('Title and author are required.'); return }
    if (!editingId && !file) { showToast('Choose a book file to upload.'); return }

    const form = new FormData()
    form.append('title', title.trim())
    form.append('author_name', authorName.trim())
    form.append('description', description.trim())
    form.append('is_published', String(isPublished))
    if (file) form.append('file', file)
    if (coverImage) form.append('cover_image', coverImage)

    setUploading(true)
    const r = editingId
      ? await apiUpload('PATCH', `/api/v1/admin/content/books/${editingId}`, form)
      : await apiUpload('POST', '/api/v1/admin/content/books', form)
    setUploading(false)

    if (r.ok) { showToast(editingId ? 'Book updated.' : 'Book uploaded.'); resetForm(); load() }
    else showToast(r.message ?? 'Upload failed.')
  }

  const remove = async (id: string) => {
    const r = await api('DELETE', `/api/v1/admin/content/books/${id}`)
    if (r.ok) { showToast('Book deleted.'); load() } else showToast(r.message ?? 'Delete failed.')
  }

  return (
    <div>
      <div className="flex justify-end mb-4">
        <PrimaryButton onClick={() => { resetForm(); setShowNew(true) }}><Upload className="w-3.5 h-3.5" /> Upload Book</PrimaryButton>
      </div>

      {showNew && (
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display text-base font-semibold text-navy dark:text-cream">{editingId ? 'Edit Book' : 'Upload a Book'}</h3>
            <button onClick={resetForm} className="text-charcoal/40 dark:text-cream/40 hover:text-navy dark:text-cream"><X className="w-4 h-4" /></button>
          </div>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <Field label="Title"><TextInput value={title} onChange={e => setTitle(e.target.value)} /></Field>
            <Field label="Author"><TextInput value={authorName} onChange={e => setAuthorName(e.target.value)} /></Field>
          </div>
          <div className="mb-3"><Field label="Description (optional)"><TextArea rows={2} value={description} onChange={e => setDescription(e.target.value)} /></Field></div>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <Field label={editingId ? 'Replace Book File (optional)' : 'Book File'} hint="PDF, EPUB, or DOCX — max 50MB">
              <input type="file" accept=".pdf,.epub,.docx,application/pdf,application/epub+zip,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                onChange={e => setFile(e.target.files?.[0] ?? null)}
                className="w-full text-sm font-body text-navy dark:text-cream file:mr-3 file:px-3 file:py-1.5 file:rounded-lg file:border-0 file:bg-navy/8 file:text-navy dark:file:text-cream file:text-xs file:font-semibold" />
              {file && <p className="text-xs text-charcoal/40 dark:text-cream/40 font-body mt-1">{file.name} — {(file.size / 1024 / 1024).toFixed(1)}MB</p>}
            </Field>
            <Field label="Cover Image (optional)" hint="JPG, PNG, or WebP — max 5MB">
              <input type="file" accept="image/jpeg,image/png,image/webp"
                onChange={e => setCoverImage(e.target.files?.[0] ?? null)}
                className="w-full text-sm font-body text-navy dark:text-cream file:mr-3 file:px-3 file:py-1.5 file:rounded-lg file:border-0 file:bg-navy/8 file:text-navy dark:file:text-cream file:text-xs file:font-semibold" />
              {coverImage && <p className="text-xs text-charcoal/40 dark:text-cream/40 font-body mt-1">{coverImage.name}</p>}
            </Field>
          </div>
          <label className="flex items-center gap-2 mb-4 text-sm font-body text-navy dark:text-cream">
            <input type="checkbox" checked={isPublished} onChange={e => setIsPublished(e.target.checked)} /> Published
          </label>
          <PrimaryButton onClick={submit} disabled={uploading}>
            {uploading ? 'Uploading…' : editingId ? 'Save Changes' : 'Upload Book'}
          </PrimaryButton>
        </Card>
      )}

      <div className="space-y-2 mt-4">
        {books === null && <p className="text-sm text-charcoal/40 dark:text-cream/40 font-body">Loading…</p>}
        {books?.length === 0 && <EmptyState text="No books uploaded yet." />}
        {books?.map(b => (
          <div key={b.id} className="bg-white dark:bg-navy-dark rounded-2xl border border-navy/8 p-4 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm font-body font-semibold text-navy dark:text-cream truncate">
                {b.title} {!b.is_published && <span className="text-xs text-charcoal/35 dark:text-cream/35 font-normal">(draft)</span>}
              </p>
              <p className="text-xs text-charcoal/45 dark:text-cream/45 font-body truncate">
                by {b.author_name} · {b.file_type.toUpperCase()}{b.file_size_bytes ? ` · ${(b.file_size_bytes / 1024 / 1024).toFixed(1)}MB` : ''}
              </p>
            </div>
            <div className="flex gap-2 shrink-0">
              <GhostButton onClick={() => startEdit(b)}><Pencil className="w-3.5 h-3.5" /> Edit</GhostButton>
              <DangerButton onClick={() => remove(b.id)}><Trash2 className="w-3.5 h-3.5" /> Delete</DangerButton>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
