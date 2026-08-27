'use client'
import { useState, useEffect, useCallback, useRef } from 'react'
import { useSearchParams } from 'next/navigation'
import { ChevronLeft, ChevronRight, Loader2, WifiOff, FileText, AlignLeft } from 'lucide-react'
import Image from 'next/image'
import type { Chapter, Verse, Book, Translation, SearchResult } from '@/modules/bible/types'
import { BOOKS, TRANSLATIONS } from '@/modules/bible/services/mock-data'
import { loadStudyState, addHighlight, addBookmark, removeBookmark, saveNote, deleteNote, syncFromServer } from '@/modules/study/services/study-service'
import type { LocalStudyState, HighlightColor } from '@/modules/study/types'
import { HIGHLIGHT_COLORS } from '@/modules/study/types'
import BibleToolbar     from './BibleToolbar'
import BookSelector     from './BookSelector'
import ChapterSelector  from './ChapterSelector'
import BibleSearch      from './BibleSearch'
import VerseContextMenu from './VerseContextMenu'
import NoteEditor       from '@/modules/study/components/NoteEditor'
import { InlineCommentary, NoteIndicator, CommentaryPopup } from '@/modules/commentary/components/CommentaryPanel'
import { HelloAOCommentaryProvider } from '@/modules/commentary/providers/helloao'
import { loadStudySettings } from '@/modules/commentary/types'
import type { CommentaryNote } from '@/modules/commentary/types'

// ─── TYPES ────────────────────────────────────────────────────────────────────
type Panel = 'book' | 'chapter' | 'search' | null
type NoteEditorState = { verse: Verse } | null
type ContextMenu = { verse: Verse; x: number; y: number } | null
type NoteDisplayFormat = 'popup' | 'inline'  // OLD = popup, NEW = inline

// ─── READING POSITION ────────────────────────────────────────────────────────
const POSITION_KEY = 'bc_reading_position'
function savePosition(bookId: string, chapter: number, translation: string) {
  try { localStorage.setItem(POSITION_KEY, JSON.stringify({ bookId, chapter, translation, savedAt: new Date().toISOString() })) } catch { /* ignore */ }
}
function loadPosition() {
  try { return JSON.parse(localStorage.getItem(POSITION_KEY) ?? 'null') } catch { return null }
}

// ─── COMPONENT ────────────────────────────────────────────────────────────────
export default function BibleReader() {
  const searchParams = useSearchParams()
  const appliedInitialPosition = useRef(false)
  const [translation, setTranslation] = useState('BSB') // NIV is access-denied with this API key/tier — see bible-api.ts header
  const [bookId,      setBookId]      = useState('JHN')
  const [chapter,     setChapter]     = useState(3)
  const [translations] = useState<Translation[]>(TRANSLATIONS)
  const [books]        = useState<Book[]>(BOOKS)

  const [chapterData, setChapterData] = useState<Chapter | null>(null)
  const [loading,     setLoading]     = useState(true)
  const [error,       setError]       = useState<string | null>(null)

  const [panel,           setPanel]           = useState<Panel>(null)
  const [fontSize,        setFontSize]        = useState(18)
  const [contextMenu,     setContextMenu]     = useState<ContextMenu>(null)
  const [noteEditor,      setNoteEditor]      = useState<NoteEditorState>(null)
  const [studyState,      setStudyState]      = useState<LocalStudyState>({ highlights: {}, bookmarks: {}, notes: {} })
  const [authed,          setAuthed]          = useState(false) // Real check only — see effect below. Never hardcoded.
  const [toast,           setToast]           = useState<string | null>(null)
  // Note display format: 'popup' = OLD (link in context menu), 'inline' = NEW (text under verse)
  const [noteFormat,      setNoteFormat]      = useState<NoteDisplayFormat>('inline')
  // Study commentary -- distinct from the personal "note" state above.
  // notes_mode comes from the user's saved study settings (defaults to
  // 'inline'); commentaryIndex marks which verses in the current chapter
  // have any commentary at all, so we don't fetch per-verse notes for
  // every verse up front -- only ones known to have something to show.
  const [commentaryMode,  setCommentaryMode]  = useState<'none' | 'popup' | 'inline'>('popup')
  const [commentaryIndex, setCommentaryIndex] = useState<Record<number, boolean>>({})
  const [commentaryNotes, setCommentaryNotes] = useState<Record<number, CommentaryNote[]>>({})
  const [commentaryOpenVerse, setCommentaryOpenVerse] = useState<number | null>(null)

  const contentRef = useRef<HTMLDivElement>(null)
  const currentBook = books.find(b => b.bookId === bookId) ?? null

  // Load study state — local-first, always instant. Then a REAL authentication
  // check (same 401-vs-200 convention already established for Journal and
  // Reading Plans) determines whether to activate the previously dormant
  // syncFromServer() merge. Confirmed problem this closes: this component
  // previously called every study mutation with a hardcoded `false`, so the
  // server sync half of study-service.ts's already-correct local-first
  // design was never reachable.
  useEffect(() => {
    setStudyState(loadStudyState())

    fetch('/api/v1/study/highlights', { credentials: 'include' })
      .then(res => {
        if (res.status === 401) return null // Anonymous — no behaviour change.
        setAuthed(true)
        return syncFromServer()
      })
      .then(merged => { if (merged) setStudyState(merged) })
      .catch(() => { /* Treat as anonymous on any network failure — never block the reader. */ })
  }, [])

  const refreshStudy = () => setStudyState(loadStudyState())

  // Load chapter
  const loadChapter = useCallback(async (t: string, b: string, c: number) => {
    setLoading(true); setError(null); setContextMenu(null)
    try {
      const res  = await fetch(`/api/v1/bible/chapter/${t}/${b}/${c}`)
      const data = await res.json()
      if (data.success && data.data) {
        setChapterData(data.data)
        savePosition(b, c, t)
        contentRef.current?.scrollTo({ top: 0, behavior: 'smooth' })

        // Study commentary — load which verses have notes for this chapter,
        // then (inline mode only) eagerly fetch the actual note text so it
        // can render immediately rather than per-verse on open.
        setCommentaryNotes({})
        setCommentaryOpenVerse(null)
        HelloAOCommentaryProvider.getChapterIndex(b, c, t).then(async idx => {
          setCommentaryIndex(idx.has_notes)
          const mode = loadStudySettings().notes_mode
          setCommentaryMode(mode)
          if (mode === 'inline') {
            const verseNums = Object.keys(idx.has_notes).map(Number)
            const entries = await Promise.all(
              verseNums.map(async v => [v, await HelloAOCommentaryProvider.getVerseNotes(b, c, v, t)] as const)
            )
            setCommentaryNotes(Object.fromEntries(entries))
          }
        }).catch(() => { /* commentary is supplementary — never blocks reading */ })
      } else {
        setError('Unable to load this chapter. Please try again.')
      }
    } catch {
      setError('No internet connection. Please check your network.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    // Deep-link support: /bible?book=ISA&chapter=40 takes priority over any
    // saved reading position -- this is what makes "Read Isaiah 40" style
    // links from elsewhere in the app (homepage daily verse, etc.) actually
    // navigate to that specific passage instead of just opening wherever
    // the reader last left off. Keyed off useSearchParams (not a one-shot
    // window.location.search read) so a second link to /bible while the
    // reader is already mounted -- App Router doesn't remount on same-route
    // navigation -- still lands on the newly linked passage instead of
    // silently staying put.
    const linkedBook    = searchParams.get('book')
    const linkedChapter = searchParams.get('chapter')
    if (linkedBook && BOOKS.some(b => b.bookId === linkedBook)) {
      const c = Math.max(1, parseInt(linkedChapter ?? '1') || 1)
      setBookId(linkedBook); setChapter(c); loadChapter(translation, linkedBook, c)
      return
    }

    // No (valid) deep link in the URL -- fall back to the saved reading
    // position, but only on the very first load, so navigating elsewhere
    // and back to a bare /bible doesn't fight the Next/Prev/selector state
    // the user already set up in this session.
    if (appliedInitialPosition.current) return
    appliedInitialPosition.current = true

    const saved = loadPosition()
    // Guard against a stale saved translation from before this fix (e.g.
    // "NIV", which is access-denied and no longer offered) silently
    // overriding the working default -- only trust it if it's one of the
    // translations we actually support today.
    const knownCodes = TRANSLATIONS.map(t => t.code)
    if (saved && knownCodes.includes(saved.translation)) {
      setBookId(saved.bookId); setChapter(saved.chapter); setTranslation(saved.translation); loadChapter(saved.translation, saved.bookId, saved.chapter)
    } else if (saved) {
      setBookId(saved.bookId); setChapter(saved.chapter); loadChapter(translation, saved.bookId, saved.chapter)
    }
    else loadChapter(translation, bookId, chapter)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams])

  useEffect(() => { loadChapter(translation, bookId, chapter) }, [translation, bookId, chapter, loadChapter])

  // Toast
  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 2500) }

  // Navigation
  const goToPrevChapter = () => {
    if (!chapterData?.previousChapter) return
    setBookId(chapterData.previousChapter.bookId); setChapter(chapterData.previousChapter.chapterNumber)
  }
  const goToNextChapter = () => {
    if (!chapterData?.nextChapter) return
    setBookId(chapterData.nextChapter.bookId); setChapter(chapterData.nextChapter.chapterNumber)
  }

  // Verse actions
  const handleVerseClick = (verse: Verse, e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation()
    setContextMenu({ verse, x: e.clientX, y: e.clientY })
  }

  const handleHighlight = async (verse: Verse, color: string) => {
    await addHighlight(verse.id, verse.reference, color as HighlightColor, authed)
    refreshStudy(); showToast('Verse highlighted')
  }

  const handleBookmark = async (verse: Verse) => {
    const isBookmarked = !!studyState.bookmarks[verse.id]
    if (isBookmarked) { await removeBookmark(verse.id, authed); showToast('Bookmark removed') }
    else { await addBookmark(verse.id, verse.reference, undefined, authed); showToast('Verse bookmarked') }
    refreshStudy()
  }

  const handleCopy = (verse: Verse) => {
    navigator.clipboard?.writeText(`"${verse.text}" — ${verse.reference} (${translation})`)
      .then(() => showToast('Verse copied'))
      .catch(() => showToast('Unable to copy'))
  }

  const handleSaveNote = async (verse: Verse, content: string, tags: string[]) => {
    await saveNote(verse.id, verse.reference, content, tags, authed)
    refreshStudy(); showToast('Note saved')
  }

  const handleDeleteNote = async (verse: Verse) => {
    await deleteNote(verse.id, authed)
    refreshStudy(); showToast('Note deleted')
  }

  const handleSearchResult = (result: SearchResult) => {
    setBookId(result.bookId); setChapter(result.chapterNumber); setPanel(null)
  }

  const handleOpenCommentary = async (verseNum: number) => {
    setCommentaryOpenVerse(verseNum)
    if (!commentaryNotes[verseNum]) {
      const notes = await HelloAOCommentaryProvider.getVerseNotes(bookId, chapter, verseNum, translation)
      setCommentaryNotes(prev => ({ ...prev, [verseNum]: notes }))
    }
  }

  return (
    <div className="min-h-screen bg-white dark:bg-navy-dark flex flex-col">
      <BibleToolbar
        currentBook={currentBook}
        currentChapter={chapter}
        currentTranslation={translation}
        translations={translations}
        onBookClick={() => setPanel(p => p === 'book' ? null : 'book')}
        onChapterClick={() => setPanel(p => p === 'chapter' ? null : 'chapter')}
        onTranslationChange={setTranslation}
        onSearchClick={() => setPanel(p => p === 'search' ? null : 'search')}
        fontSize={fontSize}
        onFontSizeChange={setFontSize}
      />

      <div className="flex flex-1 relative">
        {/* Side panel */}
        {panel && (
          <>
            <div className="fixed inset-0 z-20 bg-navy/20 backdrop-blur-sm" onClick={() => setPanel(null)} />
            <div className="fixed left-0 top-14 bottom-0 z-30 w-80 bg-white dark:bg-navy-dark shadow-2xl shadow-navy/20 flex flex-col">
              {panel === 'book'    && <BookSelector books={books} currentBookId={bookId} onSelect={b => { setBookId(b.bookId); setChapter(1); setPanel('chapter') }} onClose={() => setPanel(null)} />}
              {panel === 'chapter' && currentBook && <ChapterSelector book={currentBook} currentChapter={chapter} onSelect={c => { setChapter(c); setPanel(null) }} onClose={() => setPanel(null)} />}
              {panel === 'search'  && <BibleSearch translation={translation} onSelectVerse={handleSearchResult} onClose={() => setPanel(null)} />}
            </div>
          </>
        )}

        {/* Main reading area */}
        <main ref={contentRef} className="flex-1 overflow-y-auto" onClick={() => contextMenu && setContextMenu(null)}>
          <div className="max-w-2xl mx-auto px-5 sm:px-8 py-8 pb-28">

            {/* Chapter heading with logo accent */}
            <div className="mb-8 text-center">
              <div className="flex items-center justify-center gap-2 mb-3">
                <div className="relative w-8 h-8 rounded-lg overflow-hidden shadow-sm opacity-60">
                  <Image src="/images/logo.png" alt="" fill className="object-cover" sizes="32px" />
                </div>
              </div>
              <p className="text-xs font-body font-medium text-navy/35 dark:text-cream/35 tracking-widest uppercase mb-1">{translation}</p>
              <h1 className="font-display text-3xl sm:text-4xl font-light text-navy dark:text-cream">
                {currentBook?.name} {chapter}
              </h1>
              {chapterData && <p className="text-xs text-charcoal/30 dark:text-cream/30 font-body mt-1">{chapterData.totalVerses} verses</p>}
            </div>

            {/* Note format toggle — OLD vs NEW */}
            {!loading && !error && chapterData && Object.keys(studyState.notes).length > 0 && (
              <div className="flex items-center justify-end gap-2 mb-4">
                <span className="text-xs text-charcoal/35 dark:text-cream/35 font-body">Notes:</span>
                <div className="flex bg-navy/5 rounded-lg p-0.5">
                  <button
                    onClick={() => setNoteFormat('popup')}
                    title="Old format: note link in verse actions"
                    className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-body transition-all ${noteFormat === 'popup' ? 'bg-white dark:bg-navy-dark text-navy dark:text-cream shadow-sm' : 'text-charcoal/40 dark:text-cream/40 hover:text-navy dark:text-cream'}`}
                  >
                    <FileText className="w-3 h-3" /> Links
                  </button>
                  <button
                    onClick={() => setNoteFormat('inline')}
                    title="New format: explanatory text under verse"
                    className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-body transition-all ${noteFormat === 'inline' ? 'bg-white dark:bg-navy-dark text-navy dark:text-cream shadow-sm' : 'text-charcoal/40 dark:text-cream/40 hover:text-navy dark:text-cream'}`}
                  >
                    <AlignLeft className="w-3 h-3" /> Inline
                  </button>
                </div>
              </div>
            )}

            {/* Loading skeleton */}
            {loading && (
              <div className="space-y-4 animate-pulse">
                {Array.from({ length: 8 }, (_, i) => (
                  <div key={i} className="flex gap-3">
                    <div className="w-5 h-3 bg-navy/8 rounded shrink-0 mt-1" />
                    <div className="flex-1 space-y-1.5">
                      <div className={`h-3.5 bg-navy/6 rounded ${i % 3 === 0 ? 'w-full' : i % 3 === 1 ? 'w-4/5' : 'w-3/5'}`} />
                      {i % 2 === 0 && <div className="h-3.5 w-2/3 bg-navy/4 rounded" />}
                    </div>
                  </div>
                ))}
                <div className="flex justify-center pt-4">
                  <Loader2 className="w-5 h-5 text-navy/20 dark:text-cream/20 animate-spin" />
                </div>
              </div>
            )}

            {/* Error state */}
            {!loading && error && (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <WifiOff className="w-12 h-12 text-navy/20 dark:text-cream/20 mb-4" />
                <p className="font-body text-sm text-charcoal/50 dark:text-cream/50 mb-2">{error}</p>
                <button onClick={() => loadChapter(translation, bookId, chapter)} className="px-5 py-2 bg-navy text-white text-sm font-body font-medium rounded-full hover:bg-navy-light transition-colors">
                  Try again
                </button>
              </div>
            )}

            {/* Verses */}
            {!loading && !error && chapterData && (
              <div className="space-y-1">
                {chapterData.verses.map(verse => {
                  const highlight  = studyState.highlights[verse.id]
                  const isBookmarked = !!studyState.bookmarks[verse.id]
                  const note       = studyState.notes[verse.id]
                  const hlConfig   = highlight ? HIGHLIGHT_COLORS[highlight.color] : null

                  return (
                    <div key={verse.id} className="group">
                      {/* Verse row */}
                      <div
                        className={`relative flex gap-3 px-2 py-1.5 rounded-lg cursor-pointer transition-all duration-150 hover:bg-navy/3 ${hlConfig ? hlConfig.bg : ''}`}
                        onClick={e => handleVerseClick(verse, e)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={e => e.key === 'Enter' && handleVerseClick(verse, e as unknown as React.MouseEvent)}
                        aria-label={`${verse.reference}: ${verse.text}. Press Enter for verse actions.`}
                      >
                        {/* Verse number */}
                        <span className="select-none text-xs font-body font-semibold text-navy/30 dark:text-cream/30 mt-1 shrink-0 w-5 text-right leading-normal" aria-hidden="true">
                          {verse.verseNumber}
                        </span>

                        {/* Verse text */}
                        <p className="font-display text-navy/85 dark:text-cream/85 leading-relaxed flex-1" style={{ fontSize: `${fontSize}px`, lineHeight: '1.75' }}>
                          {verse.text}
                          {/* OLD FORMAT: note link shown inline with verse text */}
                          {noteFormat === 'popup' && note && (
                            <button
                              onClick={e => { e.stopPropagation(); setNoteEditor({ verse }) }}
                              className="inline-flex items-center gap-1 ml-2 px-1.5 py-0.5 rounded-md bg-gold/15 text-gold text-xs font-body font-medium hover:bg-gold/25 transition-colors align-middle"
                              aria-label={`View note for ${verse.reference}`}
                            >
                              <FileText className="w-2.5 h-2.5" /> Note
                            </button>
                          )}
                          {commentaryMode === 'popup' && commentaryIndex[verse.verseNumber] && (
                            <NoteIndicator onClick={() => handleOpenCommentary(verse.verseNumber)} />
                          )}
                        </p>

                        {/* Bookmark indicator */}
                        {isBookmarked && (
                          <div className="absolute top-0 right-2 w-2.5 h-4 bg-gold rounded-b-sm" aria-label="Bookmarked" />
                        )}
                      </div>

                      {/* NEW FORMAT: explanatory note text displayed under verse */}
                      {noteFormat === 'inline' && note && (
                        <div
                          className="ml-8 mr-2 mt-0.5 mb-2 px-3 py-2.5 rounded-lg bg-gold/8 border-l-2 border-gold/40 cursor-pointer hover:bg-gold/12 transition-colors"
                          onClick={() => setNoteEditor({ verse })}
                          role="button"
                          aria-label={`Edit note for ${verse.reference}`}
                        >
                          <div className="flex items-center gap-1.5 mb-1">
                            <FileText className="w-2.5 h-2.5 text-gold/70 shrink-0" />
                            <span className="text-xs text-gold/70 font-body font-semibold">Your note</span>
                          </div>
                          <p className="text-xs text-charcoal/60 dark:text-cream/60 font-body leading-relaxed line-clamp-3">
                            {note.content}
                          </p>
                          {note.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1.5">
                              {note.tags.map(tag => (
                                <span key={tag} className="px-1.5 py-0.5 rounded-full bg-gold/10 text-gold/60 text-[9px] font-body">#{tag}</span>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Study commentary — inline mode, distinct from the personal note above */}
                      {commentaryMode === 'inline' && commentaryIndex[verse.verseNumber] && commentaryNotes[verse.verseNumber] && (
                        <InlineCommentary
                          reference={verse.reference}
                          notes={commentaryNotes[verse.verseNumber]}
                          loading={false}
                        />
                      )}
                    </div>
                  )
                })}
              </div>
            )}

            {/* Translation attribution */}
            {!loading && !error && chapterData && (
              <div className="mt-12 pt-6 border-t border-navy/8 text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <div className="relative w-5 h-5 rounded opacity-40">
                    <Image src="/images/logo.png" alt="" fill className="object-cover" sizes="20px" />
                  </div>
                </div>
                <p className="text-xs text-charcoal/25 dark:text-cream/25 font-body leading-relaxed">
                  Scripture quotations marked ({translation}) are taken from the Holy Bible,{' '}
                  {TRANSLATIONS.find(t => t.code === translation)?.name}. All rights reserved.
                </p>
              </div>
            )}
          </div>

          {/* Chapter nav */}
          {!loading && !error && chapterData && (
            <div className="sticky bottom-0 bg-white/95 dark:bg-navy-dark backdrop-blur-md border-t border-navy/8">
              <div className="max-w-2xl mx-auto px-5 py-3 flex items-center justify-between gap-4">
                <button onClick={goToPrevChapter} disabled={!chapterData.previousChapter} className="flex items-center gap-2 px-4 py-2 rounded-full border border-navy/12 text-navy/60 dark:text-cream/60 hover:text-navy dark:text-cream hover:border-navy/25 disabled:opacity-30 disabled:cursor-not-allowed transition-all text-sm font-body font-medium">
                  <ChevronLeft className="w-4 h-4" /> Previous
                </button>
                <span className="text-xs text-charcoal/30 dark:text-cream/30 font-body">{currentBook?.name} {chapter} · {translation}</span>
                <button onClick={goToNextChapter} disabled={!chapterData.nextChapter} className="flex items-center gap-2 px-4 py-2 rounded-full border border-navy/12 text-navy/60 dark:text-cream/60 hover:text-navy dark:text-cream hover:border-navy/25 disabled:opacity-30 disabled:cursor-not-allowed transition-all text-sm font-body font-medium">
                  Next <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Verse context menu */}
      {contextMenu && (
        <VerseContextMenu
          verse={contextMenu.verse}
          position={{ x: contextMenu.x, y: contextMenu.y }}
          noteContent={studyState.notes[contextMenu.verse.id]?.content}
          onClose={() => setContextMenu(null)}
          onHighlight={handleHighlight}
          onBookmark={handleBookmark}
          onNote={v => { setNoteEditor({ verse: v }); setContextMenu(null) }}
          onCopy={handleCopy}
          onAIStudy={v => { showToast(`AI Study for ${v.reference} — coming in Phase 5`); setContextMenu(null) }}
        />
      )}

      {/* Note editor modal */}
      {noteEditor && (
        <NoteEditor
          verseReference={noteEditor.verse.reference}
          verseText={noteEditor.verse.text}
          initialContent={studyState.notes[noteEditor.verse.id]?.content ?? ''}
          initialTags={studyState.notes[noteEditor.verse.id]?.tags ?? []}
          onSave={(content, tags) => handleSaveNote(noteEditor.verse, content, tags)}
          onDelete={() => handleDeleteNote(noteEditor.verse)}
          onClose={() => setNoteEditor(null)}
        />
      )}

      {/* Study commentary popup — distinct from the personal note editor above */}
      {commentaryOpenVerse !== null && chapterData && (() => {
        const v = chapterData.verses.find(x => x.verseNumber === commentaryOpenVerse)
        if (!v) return null
        return (
          <CommentaryPopup
            reference={v.reference}
            verseText={v.text}
            notes={commentaryNotes[commentaryOpenVerse] ?? []}
            loading={!commentaryNotes[commentaryOpenVerse]}
            onClose={() => setCommentaryOpenVerse(null)}
          />
        )
      })()}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 px-5 py-2.5 bg-navy text-white text-sm font-body font-medium rounded-full shadow-xl animate-fade-in" role="status" aria-live="polite">
          {toast}
        </div>
      )}
    </div>
  )
}
