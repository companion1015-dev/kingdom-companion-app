// ─── BIBLE API SERVICE — YouVersion Platform ─────────────────────────────────
// Corrected 2026: this file previously targeted api.scripture.api.bible
// (API.Bible, run by American Bible Society) — a completely different
// service from YouVersion (run by Life.Church), which is what this project
// actually has credentials for. That mismatch caused every request to fail
// with 403 Forbidden, regardless of key correctness — a valid YouVersion key
// was simply being sent to the wrong company's servers.
//
// Real YouVersion Platform API, verified directly against
// developers.youversion.com as of this fix:
//   Base URL:       https://api.youversion.com/v1
//   Auth header:    X-YVP-App-Key: <your key>
//   Bible versions: integer IDs (e.g. 111 = NIV), NOT the alphanumeric
//                   hash-style IDs API.Bible uses — the old TRANSLATION_IDS
//                   map below was entirely wrong and has been replaced.
//
// HOW TO CONNECT YOUR API KEY:
// 1. platform.youversion.com -> your app -> App Keys
// 2. Add to .env.local:  BIBLE_API_KEY=your-key-here
// 3. Add to Vercel:      Settings -> Environment Variables -> BIBLE_API_KEY
// 4. Redeploy
//
// KNOWN LIMITATION, stated honestly rather than papered over: YouVersion's
// public API does not currently expose a full-text search endpoint (unlike
// API.Bible, which the old code assumed existed). searchBible() below uses
// local sample data only -- this is a genuine product gap, not a bug, until
// YouVersion adds one or a separate search provider is integrated.
//
// NOTE: Scripture text is NEVER stored permanently (Constitution paragraph 4, DSD 1.10)
// It is fetched fresh each request and cached per Workbox strategy only.

import type { Translation, Book, Chapter, SearchResponse } from '../types'
import { TRANSLATIONS, BOOKS, getMockChapter, SAMPLE_SEARCH_RESULTS } from './mock-data'

const YOUVERSION_API_BASE = 'https://api.youversion.com/v1'
const BIBLE_API_KEY       = process.env.BIBLE_API_KEY

// Real YouVersion integer Bible version IDs (confirmed from official docs).
const TRANSLATION_IDS: Record<string, number> = {
  ASV:   12,
  NIV:   111,
  WEBUS: 206,
  BSB:   3034,
}

function apiHeaders() {
  return { 'X-YVP-App-Key': BIBLE_API_KEY ?? '', 'Accept': 'application/json' }
}

function getVersionId(code: string): number {
  return TRANSLATION_IDS[code] ?? TRANSLATION_IDS['NIV']
}

// --- TRANSLATIONS -------------------------------------------------------------

export async function getTranslations(): Promise<Translation[]> {
  if (!BIBLE_API_KEY) {
    console.log('[BibleAPI] No API key - using mock translations. Add BIBLE_API_KEY to .env.local')
    return TRANSLATIONS
  }

  try {
    const res = await fetch(`${YOUVERSION_API_BASE}/bibles`, {
      headers: apiHeaders(),
      next: { revalidate: 86400 },
    })
    if (!res.ok) throw new Error(`YouVersion API ${res.status}: ${res.statusText}`)
    const body = await res.json()

    const live = (body.data ?? [])
      .filter((b: Record<string, unknown>) => Object.values(TRANSLATION_IDS).includes(Number(b.id)))
      .map((b: Record<string, unknown>) => ({
        id:          String(b.id),
        code:        String(b.abbreviation ?? '').toUpperCase(),
        name:        String(b.title ?? b.name ?? ''),
        language:    String((b.language as Record<string, unknown>)?.id ?? 'en'),
        abbreviation:String(b.abbreviation ?? '').toUpperCase(),
        isAvailable: true,
      }))

    return live.length > 0 ? live : TRANSLATIONS
  } catch (error) {
    console.error('[BibleAPI] getTranslations failed:', error)
    return TRANSLATIONS
  }
}

// --- BOOKS ----------------------------------------------------------------------

export async function getBooks(translationCode: string): Promise<Book[]> {
  if (!BIBLE_API_KEY) return BOOKS

  try {
    const versionId = getVersionId(translationCode)
    const res = await fetch(`${YOUVERSION_API_BASE}/bibles/${versionId}/books`, {
      headers: apiHeaders(),
      next: { revalidate: 86400 },
    })
    if (!res.ok) throw new Error(`YouVersion API ${res.status}`)
    const body = await res.json()

    return (body.data ?? []).map((b: Record<string, unknown>, i: number) => {
      const testament: 'OT' | 'NT' = i < 39 ? 'OT' : 'NT'
      const usfm      = String(b.usfm ?? b.id ?? '')
      const localBook = BOOKS.find(lb => lb.bookId === usfm)
      return {
        id:          usfm,
        bookId:      usfm,
        name:        String(b.title ?? b.name ?? ''),
        abbreviation:String(b.abbreviation ?? usfm),
        testament,
        bookOrder:   i + 1,
        chapterCount:Number(b.chapter_count ?? localBook?.chapterCount ?? 0),
        group:       localBook?.group ?? (testament === 'OT' ? 'Old Testament' : 'New Testament'),
      }
    })
  } catch (error) {
    console.error('[BibleAPI] getBooks failed:', error)
    return BOOKS
  }
}

// --- CHAPTER ------------------------------------------------------------------

export async function getChapter(
  translation: string,
  bookId:      string,
  chapter:     number,
): Promise<Chapter | null> {
  if (!BIBLE_API_KEY) {
    console.log(`[BibleAPI] No API key - using mock data for ${bookId} ${chapter}`)
    return getMockChapter(bookId, chapter, translation)
  }

  try {
    const versionId = getVersionId(translation)

    const res = await fetch(
      `${YOUVERSION_API_BASE}/bibles/${versionId}/books/${bookId}/chapters/${chapter}/verses`,
      { headers: apiHeaders(), next: { revalidate: 3600 } }
    )

    if (!res.ok) {
      console.error(`[BibleAPI] Chapter ${bookId}.${chapter} failed: ${res.status}`)
      return getMockChapter(bookId, chapter, translation)
    }

    const body = await res.json()
    const localBook = BOOKS.find(b => b.bookId === bookId)
    const bookName  = localBook?.name ?? bookId

    const verses = (body.data ?? []).map((v: Record<string, unknown>, i: number) => {
      const verseNum = Number(v.verse ?? v.number ?? v.verse_number ?? i + 1)
      return {
        id:          String(v.usfm ?? v.id ?? `${bookId}.${chapter}.${verseNum}`),
        verseNumber: verseNum,
        reference:   `${bookName} ${chapter}:${verseNum}`,
        text:        cleanVerseText(String(v.content ?? v.text ?? '')),
      }
    })

    if (verses.length === 0) return getMockChapter(bookId, chapter, translation)

    return {
      id:            `${bookId}.${chapter}`,
      bookId,
      bookName,
      chapterNumber: chapter,
      totalVerses:   verses.length,
      translation,
      previousChapter: chapter > 1 ? { bookId, chapterNumber: chapter - 1 } : null,
      nextChapter:   localBook && chapter < localBook.chapterCount ? { bookId, chapterNumber: chapter + 1 } : null,
      verses,
    }
  } catch (error) {
    console.error(`[BibleAPI] getChapter error for ${bookId} ${chapter}:`, error)
    return getMockChapter(bookId, chapter, translation)
  }
}

function cleanVerseText(text: string): string {
  return text
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim()
}

// --- SEARCH ---------------------------------------------------------------------

export async function searchBible(
  query:       string,
  translation: string = 'NIV',
  _limit:      number = 20,
): Promise<SearchResponse> {
  const results = SAMPLE_SEARCH_RESULTS.filter(r =>
    r.text.toLowerCase().includes(query.toLowerCase()) ||
    r.reference.toLowerCase().includes(query.toLowerCase())
  )
  return { results, total: results.length, query, translation }
}
