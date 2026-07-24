// ─── STUDY SERVICE ────────────────────────────────────────────────────────────
// Local-first architecture: saves to localStorage immediately for instant UX,
// syncs to server when user is authenticated.
// ASD Chapter 5 endpoints: /study/highlights, /study/bookmarks, /study/notes
// DSD Chapter 2: Highlight, Bookmark, Note tables

import type {
  LocalStudyState, HighlightColor, STUDY_STORAGE_KEY as _key,
} from '../types'
import { EMPTY_STUDY_STATE, STUDY_STORAGE_KEY } from '../types'

// ─── LOCAL STATE ──────────────────────────────────────────────────────────────

export function loadStudyState(): LocalStudyState {
  try {
    const raw = localStorage.getItem(STUDY_STORAGE_KEY)
    if (!raw) return { ...EMPTY_STUDY_STATE, highlights: {}, bookmarks: {}, notes: {} }
    return JSON.parse(raw) as LocalStudyState
  } catch {
    return { ...EMPTY_STUDY_STATE, highlights: {}, bookmarks: {}, notes: {} }
  }
}

export function saveStudyState(state: LocalStudyState): void {
  try {
    localStorage.setItem(STUDY_STORAGE_KEY, JSON.stringify(state))
  } catch {
    console.error('[StudyService] Failed to persist study state')
  }
}

// ─── HIGHLIGHTS ──────────────────────────────────────────────────────────────
// ASD §5.1: POST /study/highlights, PATCH /study/highlights/:id, DELETE /study/highlights/:id

export async function addHighlight(
  verseId:   string,
  reference: string,
  color:     HighlightColor,
  isAuthenticated: boolean,
): Promise<void> {
  // Always save locally first — instant feedback
  const state = loadStudyState()
  state.highlights[verseId] = { color, reference }
  saveStudyState(state)

  // Sync to server if authenticated
  if (isAuthenticated) {
    try {
      await fetch('/api/v1/study/highlights', {
        method:      'POST',
        headers:     { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ verse_id: verseId, verse_reference: reference, color }),
      })
    } catch {
      // Local save succeeded — server sync will be retried on next load
      console.warn('[StudyService] Highlight server sync failed — saved locally')
    }
  }
}

export async function removeHighlight(
  verseId: string,
  isAuthenticated: boolean,
): Promise<void> {
  const state = loadStudyState()
  delete state.highlights[verseId]
  saveStudyState(state)

  if (isAuthenticated) {
    try {
      await fetch(`/api/v1/study/highlights/${encodeURIComponent(verseId)}`, {
        method:      'DELETE',
        credentials: 'include',
      })
    } catch {
      console.warn('[StudyService] Highlight removal server sync failed')
    }
  }
}

// ─── BOOKMARKS ────────────────────────────────────────────────────────────────
// ASD §5.2: POST /study/bookmarks, DELETE /study/bookmarks/:id

export async function addBookmark(
  verseId:    string,
  reference:  string,
  collection: string | undefined,
  isAuthenticated: boolean,
): Promise<void> {
  const state = loadStudyState()
  state.bookmarks[verseId] = { reference, collection }
  saveStudyState(state)

  if (isAuthenticated) {
    try {
      await fetch('/api/v1/study/bookmarks', {
        method:      'POST',
        headers:     { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          verse_id:        verseId,
          verse_reference: reference,
          collection_name: collection ?? null,
        }),
      })
    } catch {
      console.warn('[StudyService] Bookmark server sync failed — saved locally')
    }
  }
}

export async function removeBookmark(
  verseId: string,
  isAuthenticated: boolean,
): Promise<void> {
  const state = loadStudyState()
  delete state.bookmarks[verseId]
  saveStudyState(state)

  if (isAuthenticated) {
    try {
      await fetch(`/api/v1/study/bookmarks/${encodeURIComponent(verseId)}`, {
        method:      'DELETE',
        credentials: 'include',
      })
    } catch {
      console.warn('[StudyService] Bookmark removal server sync failed')
    }
  }
}

// ─── NOTES ───────────────────────────────────────────────────────────────────
// ASD §5.3: POST /study/notes, PATCH /study/notes/:id, DELETE /study/notes/:id

export async function saveNote(
  verseId:    string,
  reference:  string,
  content:    string,
  tags:       string[],
  isAuthenticated: boolean,
): Promise<void> {
  const state = loadStudyState()
  state.notes[verseId] = { content, reference, tags }
  saveStudyState(state)

  if (isAuthenticated) {
    try {
      await fetch('/api/v1/study/notes', {
        method:      'POST',
        headers:     { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          verse_id:        verseId,
          verse_reference: reference,
          content,
          tags,
        }),
      })
    } catch {
      console.warn('[StudyService] Note server sync failed — saved locally')
    }
  }
}

export async function deleteNote(
  verseId: string,
  isAuthenticated: boolean,
): Promise<void> {
  const state = loadStudyState()
  delete state.notes[verseId]
  saveStudyState(state)

  if (isAuthenticated) {
    try {
      await fetch(`/api/v1/study/notes/${encodeURIComponent(verseId)}`, {
        method:      'DELETE',
        credentials: 'include',
      })
    } catch {
      console.warn('[StudyService] Note deletion server sync failed')
    }
  }
}

// ─── LOAD FROM SERVER ─────────────────────────────────────────────────────────
// Called once on app load when user is authenticated — merges server data with local

export async function syncFromServer(): Promise<LocalStudyState> {
  const local = loadStudyState()

  try {
    const [hlRes, bkRes, ntRes] = await Promise.all([
      fetch('/api/v1/study/highlights', { credentials: 'include' }),
      fetch('/api/v1/study/bookmarks',  { credentials: 'include' }),
      fetch('/api/v1/study/notes',       { credentials: 'include' }),
    ])

    if (!hlRes.ok || !bkRes.ok || !ntRes.ok) return local

    const [hlData, bkData, ntData] = await Promise.all([
      hlRes.json(), bkRes.json(), ntRes.json(),
    ])

    // Merge: server wins for conflicts (SAD §3.16 conflict resolution)
    const merged: LocalStudyState = {
      highlights: { ...local.highlights },
      bookmarks:  { ...local.bookmarks  },
      notes:      { ...local.notes      },
    }

    type HighlightItem = { verse_id: string; verse_reference: string; color: HighlightColor }
    type BookmarkItem  = { verse_id: string; verse_reference: string; collection_name?: string }
    type NoteItem      = { verse_id: string; verse_reference: string; content: string; tags: string[] }

    if (hlData.success) {
      hlData.data?.forEach((h: HighlightItem) => {
        merged.highlights[h.verse_id] = { color: h.color, reference: h.verse_reference }
      })
    }
    if (bkData.success) {
      bkData.data?.forEach((b: BookmarkItem) => {
        merged.bookmarks[b.verse_id] = { reference: b.verse_reference, collection: b.collection_name }
      })
    }
    if (ntData.success) {
      ntData.data?.forEach((n: NoteItem) => {
        merged.notes[n.verse_id] = { content: n.content, reference: n.verse_reference, tags: n.tags ?? [] }
      })
    }

    saveStudyState(merged)
    return merged
  } catch {
    console.warn('[StudyService] Server sync failed — using local state')
    return local
  }
}