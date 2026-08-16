'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Search, ArrowRight, Loader2 } from 'lucide-react'

// Real fix: this previously did alert(`Searching for: ${query}`) -- a
// leftover placeholder. Now performs genuine live search against
// /api/v1/bible/search (itself now backed by real full-text search across
// the complete Bible, not 5 hardcoded samples), with results that
// deep-link to the actual verse.
//
// Real fix 2: reference-style suggestions ("Psalm 23", "John 3:16") always
// returned zero results from full-text search, since verse content never
// contains its own citation label. Now detected and routed directly to the
// passage instead of being searched for as text.

const suggestions = ['John 3:16', 'Psalm 23', 'Anxiety', 'Romans 8', 'Hope', 'Forgiveness', 'Fear', 'Isaiah 40:31']

type Result = { verseId: string; reference: string; text: string; bookId: string; chapterNumber: number }

const BOOK_NAME_TO_ID: Record<string, string> = {
  genesis: 'GEN', exodus: 'EXO', leviticus: 'LEV', numbers: 'NUM', deuteronomy: 'DEU',
  joshua: 'JOS', judges: 'JDG', ruth: 'RUT', '1 samuel': '1SA', '2 samuel': '2SA',
  '1 kings': '1KI', '2 kings': '2KI', '1 chronicles': '1CH', '2 chronicles': '2CH',
  ezra: 'EZR', nehemiah: 'NEH', esther: 'EST', job: 'JOB', psalm: 'PSA', psalms: 'PSA',
  proverbs: 'PRO', ecclesiastes: 'ECC', 'song of songs': 'SNG', 'song of solomon': 'SNG',
  isaiah: 'ISA', jeremiah: 'JER', lamentations: 'LAM', ezekiel: 'EZK', daniel: 'DAN',
  hosea: 'HOS', joel: 'JOL', amos: 'AMO', obadiah: 'OBA', jonah: 'JON', micah: 'MIC',
  nahum: 'NAM', habakkuk: 'HAB', zephaniah: 'ZEP', haggai: 'HAG', zechariah: 'ZEC',
  malachi: 'MAL', matthew: 'MAT', mark: 'MRK', luke: 'LUK', john: 'JHN', acts: 'ACT',
  romans: 'ROM', '1 corinthians': '1CO', '2 corinthians': '2CO', galatians: 'GAL',
  ephesians: 'EPH', philippians: 'PHP', colossians: 'COL', '1 thessalonians': '1TH',
  '2 thessalonians': '2TH', '1 timothy': '1TI', '2 timothy': '2TI', titus: 'TIT',
  philemon: 'PHM', hebrews: 'HEB', james: 'JAS', '1 peter': '1PE', '2 peter': '2PE',
  '1 john': '1JN', '2 john': '2JN', '3 john': '3JN', jude: 'JUD', revelation: 'REV',
}

/** Detects queries like "Psalm 23" or "John 3:16" and returns the real book_id + chapter. */
function parseReference(raw: string): { bookId: string; chapter: number } | null {
  const m = raw.trim().match(/^([1-3]?\s?[A-Za-z ]+?)\s+(\d+)(?::\d+)?$/)
  if (!m) return null
  const bookName = m[1].trim().toLowerCase().replace(/\s+/g, ' ')
  const bookId = BOOK_NAME_TO_ID[bookName]
  if (!bookId) return null
  return { bookId, chapter: parseInt(m[2], 10) }
}

export default function SearchSection() {
  const router = useRouter()
  const [query, setQuery]     = useState('')
  const [focused, setFocused] = useState(false)
  const [results, setResults] = useState<Result[]>([])
  const [loading, setLoading] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout>>()

  const filteredSuggestions = query.length >= 2 && query.length < 3
    ? suggestions.filter(s => s.toLowerCase().includes(query.toLowerCase()))
    : []

  useEffect(() => {
    clearTimeout(debounceRef.current)
    if (query.trim().length < 3) { setResults([]); return }
    if (parseReference(query)) { setResults([]); return } // reference queries skip text search entirely
    debounceRef.current = setTimeout(async () => {
      setLoading(true)
      try {
        const res  = await fetch(`/api/v1/bible/search?q=${encodeURIComponent(query)}&limit=6`)
        const data = await res.json()
        if (data.success) setResults(data.data.results)
      } catch { /* silent -- suggestions are a convenience, not critical */ }
      finally { setLoading(false) }
    }, 350)
    return () => clearTimeout(debounceRef.current)
  }, [query])

  const goToVerse = (bookId: string, chapter: number) => {
    router.push(`/bible?book=${bookId}&chapter=${chapter}`)
  }

  const handleSearch = () => {
    if (!query.trim()) return
    const ref = parseReference(query)
    if (ref) { goToVerse(ref.bookId, ref.chapter); return }
    if (results.length > 0) goToVerse(results[0].bookId, results[0].chapterNumber)
  }

  const handleSuggestionClick = (s: string) => {
    setQuery(s)
    setFocused(true)
    const ref = parseReference(s)
    if (ref) goToVerse(ref.bookId, ref.chapter)
  }

  return (
    <section className="py-16 px-4 sm:px-6 lg:px-8 bg-cream dark:bg-navy-dark-dark" aria-labelledby="search-heading">
      <div className="max-w-2xl mx-auto text-center">
        <h2 id="search-heading" className="font-display text-3xl font-light text-navy dark:text-cream mb-2">
          Search Scripture
        </h2>
        <p className="text-charcoal/50 dark:text-cream/50 font-body text-sm mb-8">
          Search by reference, keyword, topic, person, place, or event.
        </p>

        {/* Search input */}
        <div className="relative">
          <div
            className={`relative flex items-center rounded-2xl transition-all duration-200 bg-white dark:bg-navy-dark
              ${focused
                ? 'shadow-xl shadow-navy/10 ring-2 ring-gold/30'
                : 'shadow-md shadow-navy/8 ring-1 ring-navy/8'
              }`}
          >
            <Search className="absolute left-5 w-5 h-5 text-navy/30 dark:text-cream/30 pointer-events-none" />
            <input
              type="search"
              value={query}
              onChange={e => setQuery(e.target.value)}
              onFocus={() => setFocused(true)}
              onBlur={() => setTimeout(() => setFocused(false), 150)}
              onKeyDown={e => { if (e.key === 'Enter') handleSearch() }}
              id="bible-search-input"
              placeholder="Try: 'Psalm 23', 'anxiety', 'Moses', 'hope'…"
              className="w-full pl-14 pr-14 py-4 bg-transparent text-navy dark:text-cream font-body text-base placeholder-charcoal/30 outline-none rounded-2xl"
              aria-label="Search the Bible"
            />
            <button
              className="absolute right-3 p-2.5 bg-navy hover:bg-navy-light text-white rounded-xl transition-colors"
              aria-label="Search"
              onClick={handleSearch}
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
            </button>
          </div>

          {/* Live results */}
          {focused && results.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-navy-dark rounded-2xl shadow-xl shadow-navy/10 ring-1 ring-navy/8 overflow-hidden text-left z-20">
              {results.map(r => (
                <button
                  key={r.verseId}
                  onClick={() => goToVerse(r.bookId, r.chapterNumber)}
                  className="w-full flex flex-col items-start gap-0.5 px-5 py-3 hover:bg-navy/4 transition-colors border-b border-navy/6 last:border-0"
                >
                  <span className="text-xs font-body font-semibold text-gold">{r.reference}</span>
                  <span className="text-sm font-body text-charcoal/60 dark:text-cream/60 line-clamp-1">{r.text}</span>
                </button>
              ))}
            </div>
          )}

          {/* Static suggestions before enough characters typed */}
          {focused && filteredSuggestions.length > 0 && results.length === 0 && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-navy-dark rounded-2xl shadow-xl shadow-navy/10 ring-1 ring-navy/8 overflow-hidden text-left z-20">
              {filteredSuggestions.map(s => (
                <button
                  key={s}
                  onClick={() => handleSuggestionClick(s)}
                  className="w-full flex items-center gap-2 px-5 py-3 hover:bg-navy/4 transition-colors text-sm font-body text-charcoal/60 dark:text-cream/60"
                >
                  <Search className="w-3.5 h-3.5 text-navy/30 dark:text-cream/30" />
                  {s}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Default suggestion chips */}
        {!query && (
          <div className="flex flex-wrap justify-center gap-2 mt-6">
            {suggestions.map(s => (
              <button
                key={s}
                onClick={() => handleSuggestionClick(s)}
                className="px-3.5 py-1.5 rounded-full bg-white dark:bg-navy-dark border border-navy/10 text-xs font-body text-charcoal/55 dark:text-cream/55 hover:border-gold/30 hover:text-navy dark:text-cream transition-all"
              >
                {s}
              </button>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}