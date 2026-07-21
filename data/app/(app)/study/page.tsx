'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { BookOpen, Highlighter, Bookmark, FileText, Search, ArrowRight, Trash2 } from 'lucide-react'
import { loadStudyState, removeHighlight, removeBookmark, deleteNote, syncFromServer } from '@/modules/study/services/study-service'
import type { LocalStudyState } from '@/modules/study/types'
import { HIGHLIGHT_COLORS } from '@/modules/study/types'
import Navigation from '@/components/layout/Navigation'
import Footer from '@/components/layout/Footer'

type Tab = 'bookmarks' | 'highlights' | 'notes'

export default function StudyPage() {
  const [state,     setState]     = useState<LocalStudyState | null>(null)
  const [tab,       setTab]       = useState<Tab>('bookmarks')
  const [search,    setSearch]    = useState('')
  const [loading,   setLoading]   = useState(true)
  const [authed,    setAuthed]    = useState(false) // Real check only — see effect below. Never hardcoded.

  useEffect(() => {
    setState(loadStudyState())
    setLoading(false)

    // Confirmed problem this closes: this page always read local state only,
    // even for a signed-in user, and every mutation on it was called with a
    // hardcoded `false` — the same disconnection as BibleReader.tsx. Same
    // real 401-vs-200 check, same dormant syncFromServer() now activated.
    fetch('/api/v1/study/highlights', { credentials: 'include' })
      .then(res => {
        if (res.status === 401) return null // Anonymous — no behaviour change.
        setAuthed(true)
        return syncFromServer()
      })
      .then(merged => { if (merged) setState(merged) })
      .catch(() => { /* Treat as anonymous on any network failure — never block the page. */ })
  }, [])

  if (loading || !state) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-navy/20 border-t-navy rounded-full animate-spin" />
      </div>
    )
  }

  const bookmarkList = Object.entries(state.bookmarks)
    .filter(([, v]) => !search || v.reference.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => a[1].reference.localeCompare(b[1].reference))

  const highlightList = Object.entries(state.highlights)
    .filter(([, v]) => !search || v.reference.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => a[1].reference.localeCompare(b[1].reference))

  const noteList = Object.entries(state.notes)
    .filter(([, v]) => !search ||
      v.reference.toLowerCase().includes(search.toLowerCase()) ||
      v.content.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => a[1].reference.localeCompare(b[1].reference))

  const counts = {
    bookmarks:  bookmarkList.length,
    highlights: highlightList.length,
    notes:      noteList.length,
  }

  const handleRemoveBookmark  = (verseId: string) => { removeBookmark(verseId, authed);  setState(loadStudyState()) }
  const handleRemoveHighlight = (verseId: string) => { removeHighlight(verseId, authed); setState(loadStudyState()) }
  const handleDeleteNote      = (verseId: string) => { deleteNote(verseId, authed);      setState(loadStudyState()) }

  const tabs: { id: Tab; label: string; icon: typeof Bookmark; count: number }[] = [
    { id: 'bookmarks',  label: 'Bookmarks',  icon: Bookmark,    count: counts.bookmarks  },
    { id: 'highlights', label: 'Highlights', icon: Highlighter, count: counts.highlights },
    { id: 'notes',      label: 'Notes',      icon: FileText,    count: counts.notes      },
  ]

  const empty = (label: string, icon: typeof Bookmark, hint: string) => (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      {icon({ className: 'w-12 h-12 text-navy/15 mb-4' })}
      <p className="font-body text-sm text-charcoal/50 mb-1">No {label} yet</p>
      <p className="font-body text-xs text-charcoal/35 mb-6">{hint}</p>
      <Link
        href="/bible"
        className="inline-flex items-center gap-2 px-5 py-2.5 bg-navy hover:bg-navy-light text-white text-sm font-body font-medium rounded-full transition-colors"
      >
        <BookOpen className="w-4 h-4" /> Open Bible Reader
      </Link>
    </div>
  )

  return (
    <>
      <Navigation />
      <main className="min-h-screen bg-cream pt-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">

          {/* Header */}
          <div className="mb-8">
            <h1 className="font-display text-3xl font-light text-navy mb-1">Study Workspace</h1>
            <p className="text-charcoal/50 font-body text-sm">
              Your highlights, bookmarks, and notes — saved across your reading.
            </p>
          </div>

          {/* Search */}
          <div className="relative mb-6">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-charcoal/35 pointer-events-none" />
            <input
              type="search"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search your study notes…"
              className="w-full pl-11 pr-4 py-3 bg-white rounded-xl border border-navy/10 focus:border-gold/40 focus:ring-2 focus:ring-gold/10 text-navy font-body text-sm outline-none transition-all"
            />
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mb-6 bg-white rounded-xl p-1.5 border border-navy/8">
            {tabs.map(({ id, label, icon: Icon, count }) => (
              <button
                key={id}
                onClick={() => setTab(id)}
                className={`
                  flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-body font-medium transition-all
                  ${tab === id
                    ? 'bg-navy text-white shadow-md'
                    : 'text-charcoal/50 hover:text-navy hover:bg-navy/5'
                  }
                `}
              >
                <Icon className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{label}</span>
                {count > 0 && (
                  <span className={`text-xs px-1.5 py-0.5 rounded-full ${tab === id ? 'bg-white/20 text-white' : 'bg-navy/8 text-navy/50'}`}>
                    {count}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Content */}
          {tab === 'bookmarks' && (
            <div className="space-y-2">
              {bookmarkList.length === 0
                ? empty('bookmarks', Bookmark, 'Tap any verse in the Bible Reader and select Bookmark')
                : bookmarkList.map(([verseId, data]) => (
                  <div
                    key={verseId}
                    className="flex items-center gap-4 p-4 bg-white rounded-xl border border-navy/8 hover:border-gold/20 group transition-all"
                  >
                    <Bookmark className="w-4 h-4 text-gold shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-body font-semibold text-navy">{data.reference}</p>
                      {data.collection && (
                        <p className="text-xs text-charcoal/40 font-body mt-0.5">{data.collection}</p>
                      )}
                    </div>
                    <Link
                      href={`/bible`}
                      className="p-2 text-navy/25 group-hover:text-navy transition-colors"
                      aria-label={`Open ${data.reference}`}
                    >
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                    <button
                      onClick={() => handleRemoveBookmark(verseId)}
                      className="p-2 text-charcoal/20 hover:text-red-400 transition-colors"
                      aria-label={`Remove bookmark for ${data.reference}`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))
              }
            </div>
          )}

          {tab === 'highlights' && (
            <div className="space-y-2">
              {highlightList.length === 0
                ? empty('highlights', Highlighter, 'Tap any verse in the Bible Reader and select a highlight colour')
                : highlightList.map(([verseId, data]) => {
                  const colorConfig = HIGHLIGHT_COLORS[data.color]
                  return (
                    <div
                      key={verseId}
                      className="flex items-center gap-4 p-4 bg-white rounded-xl border border-navy/8 hover:border-gold/20 group transition-all"
                    >
                      <div
                        className={`w-5 h-5 rounded-full shrink-0 ${colorConfig.bg} border-2`}
                        style={{ borderColor: colorConfig.text }}
                        aria-label={`${colorConfig.label} highlight`}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-body font-semibold text-navy">{data.reference}</p>
                        <p className="text-xs text-charcoal/40 font-body mt-0.5 capitalize">{colorConfig.label} highlight</p>
                      </div>
                      <Link
                        href={`/bible`}
                        className="p-2 text-navy/25 group-hover:text-navy transition-colors"
                      >
                        <ArrowRight className="w-4 h-4" />
                      </Link>
                      <button
                        onClick={() => handleRemoveHighlight(verseId)}
                        className="p-2 text-charcoal/20 hover:text-red-400 transition-colors"
                        aria-label={`Remove highlight for ${data.reference}`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )
                })
              }
            </div>
          )}

          {tab === 'notes' && (
            <div className="space-y-3">
              {noteList.length === 0
                ? empty('notes', FileText, 'Tap any verse in the Bible Reader and select Add note')
                : noteList.map(([verseId, data]) => (
                  <div
                    key={verseId}
                    className="p-5 bg-white rounded-xl border border-navy/8 hover:border-gold/20 group transition-all"
                  >
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <p className="text-xs font-body font-semibold text-gold">{data.reference}</p>
                      <div className="flex items-center gap-1">
                        <Link
                          href="/bible"
                          className="p-1.5 text-navy/25 group-hover:text-navy transition-colors rounded-lg hover:bg-navy/5"
                        >
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                        <button
                          onClick={() => handleDeleteNote(verseId)}
                          className="p-1.5 text-charcoal/20 hover:text-red-400 transition-colors rounded-lg hover:bg-red-50"
                          aria-label={`Delete note for ${data.reference}`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                    <p className="text-sm font-body text-charcoal/70 leading-relaxed line-clamp-3">
                      {data.content}
                    </p>
                    {data.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-3">
                        {data.tags.map(tag => (
                          <span key={tag} className="px-2 py-0.5 rounded-full bg-navy/6 text-navy/50 text-xs font-body">
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))
              }
            </div>
          )}

          {/* Sign in prompt — encourage account creation for sync.
              Fixed: previously rendered unconditionally, so a signed-in user
              whose data was already syncing would see a nonsensical prompt
              to create an account. Now correctly gated on real auth state. */}
          {!authed && (
            <div className="mt-10 p-6 rounded-2xl bg-navy/4 border border-navy/8 text-center">
              <p className="font-display text-base text-navy mb-1">
                Create a free account to sync across devices
              </p>
              <p className="text-xs text-charcoal/45 font-body mb-4">
                Your study data is saved locally. Sign in to access it on any device.
              </p>
              <Link
                href="/register"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-navy hover:bg-navy-light text-white text-sm font-body font-medium rounded-full transition-colors"
              >
                Create free account
              </Link>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  )
}
