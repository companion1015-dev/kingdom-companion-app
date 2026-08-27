// ─── BIBLE API SERVICE ────────────────────────────────────────────────────────
// getChapter() (actual reading-view Scripture text) is sourced from
// bible.helloao.org -- see the dedicated note above that function. It needs
// no API key and covers every translation this app offers for free.
//
// getBooks()/getTranslations() below still optionally use YouVersion Platform
// API when BIBLE_API_KEY is configured (both already fall back to the local
// BOOKS/TRANSLATIONS lists without one, which match the real 66-book
// structure, so this is optional polish, not required for the app to work):
//   Base URL:       https://api.youversion.com/v1
//   Auth header:    X-YVP-App-Key: <your key>
//   Get a key from: platform.youversion.com -> your app -> App Keys
//
// KNOWN LIMITATION, stated honestly rather than papered over: neither
// YouVersion nor HelloAO exposes NIV -- it's commercially licensed by
// Biblica, and no free/keyless provider carries it. BSB (Berean Standard
// Bible) is the default specifically because it's free and reads similarly
// to modern translations like NIV.
//
// NOTE: Scripture text is NEVER stored permanently (Constitution paragraph 4, DSD 1.10)
// It is fetched fresh each request and cached per Workbox strategy only.

import type { Translation, Book, Chapter, SearchResponse, SearchResult } from '../types'
import { TRANSLATIONS, BOOKS, getMockChapter, SAMPLE_SEARCH_RESULTS } from './mock-data'

const YOUVERSION_API_BASE = 'https://api.youversion.com/v1'
const BIBLE_API_KEY       = process.env.BIBLE_API_KEY

// Real YouVersion integer Bible version IDs (confirmed from official docs),
// used only by getBooks()/getTranslations() below -- getChapter() no longer
// depends on these, see HELLOAO_TRANSLATION_IDS further down.
const TRANSLATION_IDS: Record<string, number> = {
  ASV:   12,
  NIV:   111,
  WEBUS: 206,
  BSB:   3034,
  KJV:   1,
}

function apiHeaders() {
  return { 'X-YVP-App-Key': BIBLE_API_KEY ?? '', 'Accept': 'application/json' }
}

function getVersionId(code: string): number {
  return TRANSLATION_IDS[code] ?? TRANSLATION_IDS['BSB']
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
// Sourced from bible.helloao.org -- the same free, key-less, MIT-licensed,
// no-rate-limit API this file already trusts for full-text search (see
// loadCompleteBible below) and that the commentary module (helloao.ts)
// already depends on. Unlike YouVersion, it needs no signup or app key, so
// every translation this app actually offers (BSB, KJV, ASV, WEBUS -- all
// open-licence) gets real Scripture text with zero setup. NIV is still not
// obtainable here either: it's commercially licensed by Biblica and HelloAO,
// like every other provider, doesn't carry it -- see the file-level note
// above for why that's a licensing wall, not a bug.
const HELLOAO_API_BASE = 'https://bible.helloao.org/api'

// Our app's short codes -> HelloAO's own translation ids (confirmed against
// https://bible.helloao.org/api/available_translations.json -- these do NOT
// match our codes 1:1, e.g. KJV there is "eng_kjv", not "KJV").
const HELLOAO_TRANSLATION_IDS: Record<string, string> = {
  BSB:   'BSB',
  KJV:   'eng_kjv',
  ASV:   'eng_asv',
  WEBUS: 'ENGWEBP',
}

function helloaoTranslationId(code: string): string {
  return HELLOAO_TRANSLATION_IDS[code] ?? HELLOAO_TRANSLATION_IDS['BSB']
}

export async function getChapter(
  translation: string,
  bookId:      string,
  chapter:     number,
): Promise<Chapter | null> {
  try {
    const tId = helloaoTranslationId(translation)
    const res = await fetch(
      `${HELLOAO_API_BASE}/${tId}/${bookId}/${chapter}.json`,
      { next: { revalidate: 86400 } } // Scripture text for a given ref never changes -- safe to cache a full day.
    )

    if (!res.ok) {
      console.error(`[BibleAPI] Chapter ${bookId}.${chapter} (${tId}) failed: ${res.status}`)
      return getMockChapter(bookId, chapter, translation)
    }

    const body = await res.json()
    const localBook = BOOKS.find(b => b.bookId === bookId)
    const bookName  = localBook?.name ?? String(body.book?.name ?? bookId)

    const content: Record<string, unknown>[] = body.chapter?.content ?? []
    const verses = content
      .filter(item => item.type === 'verse' && item.number)
      .map(item => {
        const text = ((item.content as unknown[]) ?? [])
          .map(p => typeof p === 'string' ? p : '')
          .join(' ')
          .replace(/\s+/g, ' ')
          .trim()
        return {
          id:          `${bookId}.${chapter}.${item.number}`,
          verseNumber: Number(item.number),
          reference:   `${bookName} ${chapter}:${item.number}`,
          text,
        }
      })
      .filter(v => v.text)

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

// --- SEARCH ---------------------------------------------------------------------
// Previously only ever matched against 5 hardcoded sample verses, regardless
// of what was actually typed -- YouVersion's API has no search endpoint, so
// this had never been replaced with something real. Fixed by fetching the
// complete Bible text (BSB, public domain) from bible.helloao.org once per
// warm server instance and searching it directly -- genuine full-text
// search against actual Scripture, not a canned list.

type FlatVerse = { verseId: string; reference: string; text: string; bookId: string; bookName: string; chapterNumber: number; verseNumber: number }
let completeBibleCache: Promise<FlatVerse[]> | null = null

async function loadCompleteBible(): Promise<FlatVerse[]> {
  if (completeBibleCache) return completeBibleCache

  completeBibleCache = fetch('https://bible.helloao.org/api/BSB/complete.json')
    .then(res => { if (!res.ok) throw new Error(`${res.status}`); return res.json() })
    .then(data => {
      const flat: FlatVerse[] = []
      for (const book of data.books ?? []) {
        const bookId   = String(book.id ?? '')
        const bookName = String(book.commonName ?? book.name ?? bookId)
        for (const chapter of book.chapters ?? []) {
          const chapterNumber = Number(chapter.chapter?.number ?? chapter.number ?? 0)
          const content = chapter.chapter?.content ?? chapter.content ?? []
          for (const v of content) {
            if (v.type !== 'verse' || !v.number) continue
            const text = (v.content ?? [])
              .map((p: unknown) => typeof p === 'string' ? p : (p as { text?: string })?.text ?? '')
              .join(' ').replace(/\s+/g, ' ').trim()
            if (!text) continue
            flat.push({
              verseId: `${bookId}.${chapterNumber}.${v.number}`,
              reference: `${bookName} ${chapterNumber}:${v.number}`,
              text, bookId, bookName, chapterNumber, verseNumber: Number(v.number),
            })
          }
        }
      }
      return flat
    })
    .catch(err => {
      console.error('[BibleAPI] Failed to load complete Bible for search:', err)
      completeBibleCache = null
      return []
    })

  return completeBibleCache
}

export async function searchBible(
  query:       string,
  translation: string = 'BSB',
  limit:       number = 20,
): Promise<SearchResponse> {
  const q = query.trim().toLowerCase()
  if (!q) return { results: [], total: 0, query, translation }

  const verses = await loadCompleteBible()

  if (verses.length === 0) {
    const results = SAMPLE_SEARCH_RESULTS.filter(r =>
      r.text.toLowerCase().includes(q) || r.reference.toLowerCase().includes(q)
    )
    return { results, total: results.length, query, translation }
  }

  const refMatches  = verses.filter(v => v.reference.toLowerCase().includes(q))
  const wordMatches = verses.filter(v => !refMatches.includes(v) && v.text.toLowerCase().includes(q))
  const matched = [...refMatches, ...wordMatches].slice(0, limit)

  const results: SearchResult[] = matched.map(v => ({
    verseId: v.verseId, reference: v.reference, text: v.text,
    bookId: v.bookId, bookName: v.bookName, chapterNumber: v.chapterNumber, verseNumber: v.verseNumber,
    translation, matchedWords: [query],
  }))

  return { results, total: refMatches.length + wordMatches.length, query, translation }
}
