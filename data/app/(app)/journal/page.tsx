'use client'
import { useState, useEffect, useCallback } from 'react'
import { BookHeart, Plus, Search, Tag, CheckCircle2, Archive, Trash2, X } from 'lucide-react'
import Navigation from '@/components/layout/Navigation'
import Footer from '@/components/layout/Footer'

// Prayer Journal — PRD §4.46/§4.52-4.53, DSD §2.12. Private by architecture:
// every request below is authenticated and every server-side query is scoped
// to the calling user only (see /api/v1/journal routes). There is no
// visibility setting on this feature because there is no code path that
// exposes it to anyone else — see Constitution §7 and DSD §2.12's binding note.

type Prayer = {
  id: string
  title: string
  content: string
  category: string | null
  tags: string | null
  scripture_reference: string | null
  status: 'active' | 'answered' | 'archived'
  answered_at: string | null
  created_at: string
  updated_at: string
}

type StatusFilter = 'active' | 'answered' | 'archived' | 'all'

const CATEGORIES = ['Thanksgiving', 'Intercession', 'Personal', 'Family', 'Church', 'Healing', 'Guidance', 'Other']

export default function JournalPage() {
  const [prayers,  setPrayers]  = useState<Prayer[]>([])
  const [loading,  setLoading]  = useState(true)
  const [error,    setError]    = useState<string | null>(null)
  const [status,   setStatus]   = useState<StatusFilter>('active')
  const [search,   setSearch]   = useState('')
  const [composerOpen, setComposerOpen] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 2500) }

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams()
      if (status !== 'all') params.set('status', status)
      if (search.trim())    params.set('q', search.trim())

      const res  = await fetch(`/api/v1/journal?${params.toString()}`)
      const body = await res.json()

      if (res.status === 401) {
        setError('Please sign in to view your prayer journal.')
        setPrayers([])
        return
      }
      if (!body.success) throw new Error(body.error?.message ?? 'Failed to load')
      setPrayers(body.data)
    } catch {
      setError('Something went wrong loading your journal. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [status, search])

  useEffect(() => { load() }, [load])

  const handleMarkAnswered = async (id: string) => {
    const res  = await fetch(`/api/v1/journal/${id}`, {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ status: 'answered' }),
    })
    const body = await res.json()
    if (body.success) { showToast('Marked as answered — thank God for His faithfulness.'); load() }
    else showToast('Could not update this prayer. Please try again.')
  }

  const handleArchive = async (id: string) => {
    const res  = await fetch(`/api/v1/journal/${id}`, {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ status: 'archived' }),
    })
    const body = await res.json()
    if (body.success) { showToast('Prayer archived.'); load() }
    else showToast('Could not archive this prayer. Please try again.')
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this prayer? You can recover it within 30 days by contacting support — after that it is permanently removed.')) return
    const res  = await fetch(`/api/v1/journal/${id}`, { method: 'DELETE' })
    const body = await res.json()
    if (body.success) { showToast('Prayer deleted.'); load() }
    else showToast('Could not delete this prayer. Please try again.')
  }

  return (
    <div className="min-h-screen bg-cream-gradient">
      <Navigation />

      <main className="max-w-3xl mx-auto px-4 py-10">
        <div className="flex items-center gap-3 mb-2">
          <BookHeart className="w-7 h-7 text-navy" />
          <h1 className="text-2xl font-serif text-navy">Prayer Journal</h1>
        </div>
        <p className="text-navy/60 mb-8">
          A private place to record what&rsquo;s on your heart. Only you can ever see this.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-navy/40" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search your prayers..."
              className="w-full pl-9 pr-3 py-2 rounded-lg border border-navy/15 bg-white text-navy placeholder:text-navy/40 focus:outline-none focus:ring-2 focus:ring-gold/50"
            />
          </div>
          <button
            onClick={() => setComposerOpen(true)}
            className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-navy text-cream font-medium hover:bg-navy-light transition-colors"
          >
            <Plus className="w-4 h-4" /> New Prayer
          </button>
        </div>

        <div className="flex gap-2 mb-6">
          {(['active', 'answered', 'archived', 'all'] as StatusFilter[]).map(s => (
            <button
              key={s}
              onClick={() => setStatus(s)}
              className={`px-3 py-1.5 rounded-full text-sm capitalize transition-colors ${
                status === s ? 'bg-navy text-cream' : 'bg-white text-navy/60 border border-navy/10'
              }`}
            >
              {s}
            </button>
          ))}
        </div>

        {loading && (
          <div className="flex justify-center py-16">
            <div className="w-6 h-6 border-2 border-navy/20 border-t-navy rounded-full animate-spin" />
          </div>
        )}

        {!loading && error && (
          <div className="text-center py-16 text-navy/60">
            <p>{error}</p>
          </div>
        )}

        {!loading && !error && prayers.length === 0 && (
          <div className="text-center py-16 text-navy/50">
            <BookHeart className="w-10 h-10 mx-auto mb-3 opacity-40" />
            <p>No prayers here yet. Start with &ldquo;New Prayer&rdquo; above.</p>
          </div>
        )}

        {!loading && !error && prayers.length > 0 && (
          <ul className="space-y-3">
            {prayers.map(p => (
              <li key={p.id} className="bg-white rounded-xl border border-navy/10 p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-serif text-lg text-navy">{p.title}</h3>
                    <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-navy/50">
                      {p.category && <span>{p.category}</span>}
                      {p.scripture_reference && <span>· {p.scripture_reference}</span>}
                      {p.status === 'answered' && (
                        <span className="flex items-center gap-1 text-gold-dark">
                          <CheckCircle2 className="w-3 h-3" /> Answered
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {p.status === 'active' && (
                      <button
                        onClick={() => handleMarkAnswered(p.id)}
                        title="Mark as answered"
                        className="p-2 rounded-lg hover:bg-gold/10 text-navy/50 hover:text-gold-dark transition-colors"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                      </button>
                    )}
                    {p.status !== 'archived' && (
                      <button
                        onClick={() => handleArchive(p.id)}
                        title="Archive"
                        className="p-2 rounded-lg hover:bg-navy/5 text-navy/50 transition-colors"
                      >
                        <Archive className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(p.id)}
                      title="Delete"
                      className="p-2 rounded-lg hover:bg-red-50 text-navy/50 hover:text-red-600 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <p className="text-navy/80 mt-2 whitespace-pre-wrap">{p.content}</p>
                {p.tags && (
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {p.tags.split(',').map(t => t.trim()).filter(Boolean).map(t => (
                      <span key={t} className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-navy/5 text-navy/60 text-xs">
                        <Tag className="w-3 h-3" /> {t}
                      </span>
                    ))}
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </main>

      {composerOpen && (
        <PrayerComposer
          onClose={() => setComposerOpen(false)}
          onSaved={() => { setComposerOpen(false); showToast('Prayer saved.'); load() }}
        />
      )}

      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-navy text-cream px-4 py-2 rounded-lg shadow-lg text-sm">
          {toast}
        </div>
      )}

      <Footer />
    </div>
  )
}

function PrayerComposer({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [title,   setTitle]   = useState('')
  const [content, setContent] = useState('')
  const [category,setCategory]= useState('')
  const [tags,    setTags]    = useState('')
  const [scriptureRef, setScriptureRef] = useState('')
  const [saving,  setSaving]  = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const handleSave = async () => {
    setFormError(null)
    if (!title.trim() || !content.trim()) {
      setFormError('Please add a title and your prayer.')
      return
    }
    setSaving(true)
    try {
      const res = await fetch('/api/v1/journal', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title:               title.trim(),
          content:             content.trim(),
          category:            category || undefined,
          tags:                tags.trim() || undefined,
          scripture_reference: scriptureRef.trim() || undefined,
        }),
      })
      const body = await res.json()
      if (!body.success) {
        setFormError(body.error?.message ?? 'Could not save your prayer. Please try again.')
        return
      }
      onSaved()
    } catch {
      setFormError('Could not save your prayer. Please check your connection and try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-navy/40 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
      <div className="bg-cream w-full sm:max-w-lg sm:rounded-2xl rounded-t-2xl p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-serif text-navy">New Prayer</h2>
          <button onClick={onClose} className="p-1 text-navy/50 hover:text-navy">
            <X className="w-5 h-5" />
          </button>
        </div>

        {formError && (
          <div className="mb-4 px-3 py-2 rounded-lg bg-red-50 text-red-700 text-sm">{formError}</div>
        )}

        <div className="space-y-3">
          <input
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="Title"
            className="w-full px-3 py-2 rounded-lg border border-navy/15 bg-white focus:outline-none focus:ring-2 focus:ring-gold/50"
          />
          <textarea
            value={content}
            onChange={e => setContent(e.target.value)}
            placeholder="What's on your heart..."
            rows={5}
            className="w-full px-3 py-2 rounded-lg border border-navy/15 bg-white focus:outline-none focus:ring-2 focus:ring-gold/50 resize-none"
          />
          <select
            value={category}
            onChange={e => setCategory(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-navy/15 bg-white text-navy"
          >
            <option value="">Category (optional)</option>
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <input
            value={scriptureRef}
            onChange={e => setScriptureRef(e.target.value)}
            placeholder="Scripture reference (optional, e.g. Philippians 4:6-7)"
            className="w-full px-3 py-2 rounded-lg border border-navy/15 bg-white focus:outline-none focus:ring-2 focus:ring-gold/50"
          />
          <input
            value={tags}
            onChange={e => setTags(e.target.value)}
            placeholder="Tags, comma-separated (optional)"
            className="w-full px-3 py-2 rounded-lg border border-navy/15 bg-white focus:outline-none focus:ring-2 focus:ring-gold/50"
          />
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full mt-5 py-2.5 rounded-lg bg-navy text-cream font-medium hover:bg-navy-light transition-colors disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save Prayer'}
        </button>
      </div>
    </div>
  )
}
