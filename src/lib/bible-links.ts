// Shared helpers for deep-linking to a precise passage in the Bible Reader
// (/bible?book=&chapter=&verse=). Centralised so every call site — Hero
// verse badge, Daily Encouragement, Devotionals, Topics, Study, AI
// Companion, homepage search — builds the same URL shape and none of them
// silently drop the verse number down to a chapter-only (or fully dead)
// link.

/** Builds a /bible URL, including the verse when one is known. */
export function bibleHref(bookId: string, chapter: number, verse?: number | null): string {
  const params = new URLSearchParams({ book: bookId, chapter: String(chapter) })
  if (verse) params.set('verse', String(verse))
  return `/bible?${params.toString()}`
}

// Every verse_id/verseId in this codebase (Bible search, Topics, Study
// highlights/bookmarks/notes) is shaped "BOOKID.chapter.verse", e.g.
// "JHN.3.16" -- see modules/bible/services/bible-api.ts.
export function parseVerseId(verseId: string): { bookId: string; chapter: number; verse: number } | null {
  const parts = verseId.split('.')
  if (parts.length !== 3) return null
  const [bookId, chapterStr, verseStr] = parts
  const chapter = parseInt(chapterStr, 10)
  const verse = parseInt(verseStr, 10)
  if (!bookId || !Number.isFinite(chapter) || !Number.isFinite(verse)) return null
  return { bookId, chapter, verse }
}

// For references stored only as display text ("Isaiah 43:19", or a range
// like "Lamentations 3:22–23") -- pulls the first verse number so the link
// still lands on the exact verse instead of just the chapter.
export function firstVerseNumber(reference: string): number | null {
  const m = reference.match(/:(\d+)/)
  return m ? parseInt(m[1], 10) : null
}
