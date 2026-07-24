// ─── BIBLE API SERVICE ────────────────────────────────────────────────────────
// YouVersion / Bible.com API (platform.youversion.com)
// ASD Chapter 4 | Architecture Spec §2.3 | Constitution §4
// 
// HOW TO CONNECT YOUR API KEY:
// 1. Go to platform.youversion.com → Apps → Kingdom Companion → Details
// 2. Copy your App Key
// 3. Add to .env.local:  BIBLE_API_KEY=your-key-here
// 4. Add to Vercel:      Settings → Environment Variables → BIBLE_API_KEY
// 5. Redeploy on Vercel (automatic if using Git)
//
// YouVersion API Bible IDs (for translation selector):
// NIV = 111  |  KJV = 1   |  NKJV = 114  |  ESV = 59
// NLT = 116  |  AMP = 1588 |  MSG = 97
//
// NOTE: Scripture text is NEVER stored permanently (Constitution §4, DSD §1.10)
// It is fetched fresh each request and cached per Workbox strategy only.

import type { Translation, Book, Chapter, SearchResponse } from '../types'
import { TRANSLATIONS, BOOKS, getMockChapter, SAMPLE_SEARCH_RESULTS } from './mock-data'

const BIBLE_API_BASE = 'https://api.scripture.api.bible/v1'
const BIBLE_API_KEY  = process.env.BIBLE_API_KEY

// YouVersion translation ID map — maps our codes to their internal Bible IDs
const TRANSLATION_IDS: Record<string, string> = {
  NIV:  '78a9f6124f344018-01',
  KJV:  'de4e12af7f28f599-01',
  NKJV: '314ff0b2eba90019-01',
  ESV:  '9879dbb7cfe39e4d-01',
  NLT:  '65eec8e0b60e656b-01',
  AMP:  '1b080d32e91c98c1-01',
  MSG:  '65eec8e0b60e656b-01', // fallback to NLT if MSG not available
}

function apiHeaders() {
  return { 'api-key': BIBLE_API_KEY ?? '', 'Content-Type': 'application/json' }
}

function getBibleId(code: string): string {
  return TRANSLATION_IDS[code] ?? TRANSLATION_IDS['NIV']
}

// ─── TRANSLATIONS ─────────────────────────────────────────────────────────────

export async function getTranslations(): Promise<Translation[]> {
  if (!BIBLE_API_KEY) {
    console.log('[BibleAPI] No API key — using mock translations. Add BIBLE_API_KEY to .env.local')
    return TRANSLATIONS
  }

  try {
    const res = await fetch(`${BIBLE_API_BASE}/bibles`, {
      headers: apiHeaders(),
      next: { revalidate: 86400 },
    })
    if (!res.ok) throw new Error(`YouVersion API ${res.status}: ${res.statusText}`)
    const data = await res.json()

    // Filter to our supported translations
    const supported = Object.keys(TRANSLATION_IDS)
    const live = data.data
      ?.filter((b: Record<string, unknown>) => supported.some(code =>
        String(b.abbreviation).toUpperCase() === code ||
        String(b.id) === TRANSLATION_IDS[code]
      ))
      .map((b: Record<string, unknown>) => ({
        id:          String(b.id),
        code:        String(b.abbreviation ?? '').toUpperCase(),
        name:        String(b.name ?? ''),
        language:    String((b.language as Record<string,unknown>)?.id ?? 'en'),
        abbreviation:String(b.abbreviation ?? '').toUpperCase(),
        isAvailable: true,
      }))

    return live?.length > 0 ? live : TRANSLATIONS
  } catch (error) {
    console.error('[BibleAPI] getTranslations failed:', error)
    return TRANSLATIONS
  }
}

// ─── BOOKS ────────────────────────────────────────────────────────────────────

export async function getBooks(translationCode: string): Promise<Book[]> {
  if (!BIBLE_API_KEY) return BOOKS

  try {
    const bibleId = getBibleId(translationCode)
    const res = await fetch(`${BIBLE_API_BASE}/bibles/${bibleId}/books?include-chapters=true`, {
      headers: apiHeaders(),
      next: { revalidate: 86400 },
    })
    if (!res.ok) throw new Error(`YouVersion API ${res.status}`)
    const data = await res.json()

    return data.data?.map((b: Record<string, unknown>, i: number) => {
      // Determine testament and group
      const testament: 'OT' | 'NT' = i < 39 ? 'OT' : 'NT'
      const localBook = BOOKS.find(lb => lb.bookId === String(b.id))
      const chapters  = (b.chapters as unknown[]) ?? []
      return {
        id:          String(b.id),
        bookId:      String(b.id),
        name:        String(b.name ?? b.nameLong ?? ''),
        abbreviation:String(b.abbreviation ?? ''),
        testament,
        bookOrder:   i + 1,
        chapterCount:chapters.length || localBook?.chapterCount || 0,
        group:       localBook?.group ?? (testament === 'OT' ? 'Old Testament' : 'New Testament'),
      }
    }) ?? BOOKS
  } catch (error) {
    console.error('[BibleAPI] getBooks failed:', error)
    return BOOKS
  }
}

// ─── CHAPTER ─────────────────────────────────────────────────────────────────
// ASD §4.3: GET /bible/{translation}/books/{bookId}/chapters/{chapter}
// Constitution §4: Scripture NEVER stored permanently — streamed to client only

export async function getChapter(
  translation: string,
  bookId:      string,
  chapter:     number,
): Promise<Chapter | null> {
  if (!BIBLE_API_KEY) {
    console.log(`[BibleAPI] No API key — using mock data for ${bookId} ${chapter}`)
    return getMockChapter(bookId, chapter, translation)
  }

  try {
    const bibleId   = getBibleId(translation)
    const chapterId = `${bookId}.${chapter}`

    const res = await fetch(
      `${BIBLE_API_BASE}/bibles/${bibleId}/chapters/${chapterId}?content-type=json&include-notes=false&include-titles=true&include-chapter-numbers=false&include-verse-numbers=true&include-verse-spans=false`,
      {
        headers: apiHeaders(),
        next: { revalidate: 3600 }, // Cache 1 hour per Workbox strategy
      }
    )

    if (!res.ok) {
      console.error(`[BibleAPI] Chapter ${chapterId} failed: ${res.status}`)
      return getMockChapter(bookId, chapter, translation)
    }

    const data = await res.json()
    const ch   = data.data
    if (!ch) return getMockChapter(bookId, chapter, translation)

    const localBook    = BOOKS.find(b => b.bookId === bookId)
    const bookName     = localBook?.name ?? bookId
    const parsedVerses = parseYouVersionVerses(ch.content ?? ch.verseData ?? '', bookId, chapter, translation, bookName)

    return {
      id:            chapterId,
      bookId,
      bookName,
      chapterNumber: chapter,
      totalVerses:   parsedVerses.length,
      translation,
      previousChapter: ch.previous ? {
        bookId:        ch.previous.bookId ?? bookId,
        chapterNumber: parseInt(String(ch.previous.number ?? chapter - 1)),
      } : null,
      nextChapter: ch.next ? {
        bookId:        ch.next.bookId ?? bookId,
        chapterNumber: parseInt(String(ch.next.number ?? chapter + 1)),
      } : null,
      verses: parsedVerses,
    }
  } catch (error) {
    console.error(`[BibleAPI] getChapter error for ${bookId} ${chapter}:`, error)
    return getMockChapter(bookId, chapter, translation)
  }
}

// Parse YouVersion JSON content format into our Verse type
function parseYouVersionVerses(
  content:     unknown,
  bookId:      string,
  chapter:     number,
  translation: string,
  bookName:    string,
): Chapter['verses'] {
  // YouVersion returns content as JSON array of verse objects
  if (Array.isArray(content)) {
    return content.map((v: Record<string, unknown>, i: number) => ({
      id:          String(v.id ?? `${bookId}.${chapter}.${i + 1}`),
      verseNumber: parseInt(String(v.verse ?? i + 1)),
      reference:   `${bookName} ${chapter}:${parseInt(String(v.verse ?? i + 1))}`,
      text:        cleanVerseText(String(v.text ?? v.content ?? '')),
    }))
  }

  // Fallback: parse from string content
  if (typeof content === 'string') {
    const lines = content
      .replace(/<[^>]+>/g, ' ')          // strip HTML
      .replace(/\s+/g, ' ')              // normalise spaces
      .trim()
      .split(/\[(\d+)\]/)                // split on verse numbers like [1], [2]
      .filter(Boolean)

    const verses: Chapter['verses'] = []
    for (let i = 0; i < lines.length - 1; i += 2) {
      const verseNum = parseInt(lines[i])
      const text     = cleanVerseText(lines[i + 1] ?? '')
      if (!isNaN(verseNum) && text) {
        verses.push({
          id:          `${bookId}.${chapter}.${verseNum}`,
          verseNumber: verseNum,
          reference:   `${bookName} ${chapter}:${verseNum}`,
          text,
        })
      }
    }
    return verses.length > 0 ? verses : [{
      id: `${bookId}.${chapter}.1`, verseNumber: 1,
      reference: `${bookName} ${chapter}:1`,
      text: `[Connect to YouVersion API to display ${bookName} ${chapter} in ${translation}]`,
    }]
  }

  return []
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

// ─── SEARCH ───────────────────────────────────────────────────────────────────

export async function searchBible(
  query:       string,
  translation: string = 'NIV',
  limit:       number = 20,
): Promise<SearchResponse> {
  if (!BIBLE_API_KEY || !query.trim()) {
    const results = SAMPLE_SEARCH_RESULTS.filter(r =>
      r.text.toLowerCase().includes(query.toLowerCase()) ||
      r.reference.toLowerCase().includes(query.toLowerCase())
    )
    return { results, total: results.length, query, translation }
  }

  try {
    const bibleId = getBibleId(translation)
    const res = await fetch(
      `${BIBLE_API_BASE}/bibles/${bibleId}/search?query=${encodeURIComponent(query)}&limit=${limit}&sort=relevance`,
      { headers: apiHeaders() }
    )
    if (!res.ok) throw new Error(`YouVersion API ${res.status}`)
    const data = await res.json()

    const results = (data.data?.verses ?? []).map((v: Record<string, unknown>) => {
      const ref      = String(v.reference ?? '')
      const [book, chVerse] = ref.split(' ')
      const [ch, ve]       = String(chVerse ?? ':').split(':')
      return {
        verseId:       String(v.id ?? ''),
        reference:     ref,
        text:          cleanVerseText(String(v.text ?? '')),
        bookId:        String(v.bookId ?? book ?? ''),
        bookName:      book ?? '',
        chapterNumber: parseInt(ch ?? '0'),
        verseNumber:   parseInt(ve ?? '0'),
        translation,
        matchedWords:  [query],
      }
    })

    return { results, total: data.data?.total ?? results.length, query, translation }
  } catch (error) {
    console.error('[BibleAPI] search failed:', error)
    const results = SAMPLE_SEARCH_RESULTS.filter(r =>
      r.text.toLowerCase().includes(query.toLowerCase())
    )
    return { results, total: results.length, query, translation }
  }
}