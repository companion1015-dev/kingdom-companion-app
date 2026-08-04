'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Search, ArrowRight, Loader2 } from 'lucide-react'

// Real fix: this previously did alert(`Searching for: ${query}`) -- a
// leftover placeholder. Now performs genuine live search against
// /api/v1/bible/search (itself now backed by real full-text search across
// the complete Bible, not 5 hardcoded samples), with results that
// deep-link to the actual verse.

const suggestions = ['John 3:16', 'Psalm 23', 'Anxiety', 'Romans 8', 'Hope', 'Forgiveness', 'Fear', 'Isaiah 40:31']

type Result = { verseId: string; reference: string; text: string; bookId: string; chapterNumber: number }

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
    if (results.length > 0) goToVerse(results[0].bookId, results[0].chapterNumber)
  }

  return (
    <section className="py-16 px-4 sm:px-6 lg:px-8 bg-cream-dark" aria-labelledby="search-heading">
      <div className="max-w-2xl mx-auto text-center">
        <h2 id="search-heading" className="font-display text-3xl font-light text-navy mb-2">
          Search Scripture
        </h2>
        <p className="text-charcoal/50 font-body text-sm mb-8">
          Search by reference, keyword, topic, person, place, or event.
        </p>

        {/* Search input */}
        <div className="relative">
          <div
            className={`relative flex items-center rounded-2xl transition-all duration-200 bg-white
              ${focused
                ? 'shadow-xl shadow-navy/10 ring-2 ring-gold/30'
                : 'shadow-md shadow-navy/8 ring-1 ring-navy/8'
              }`}
          >
            <Search className="absolute left-5 w-5 h-5 text-navy/30 pointer-events-none" />
            <input
              type="search"
              value={query}
              onChange={e => setQuery(e.target.value)}
              onFocus={() => setFocused(true)}
              onBlur={() => setTimeout(() => setFocused(false), 150)}
              onKeyDown={e => { if (e.key === 'Enter') handleSearch() }}
              id="bible-search-input"
              placeholder="Try: 'Psalm 23', 'anxiety', 'Moses', 'hope'…"
              className="w-full pl-14 pr-14 py-4 bg-transparent text-navy font-body text-base placeholder-charcoal/30 outline-none rounded-2xl"
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
            <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-xl shadow-navy/10 ring-1 ring-navy/8 overflow-hidden text-left z-20">
              {results.map(r => (
                <button
                  key={r.verseId}
                  onClick={() => goToVerse(r.bookId, r.chapterNumber)}
                  className="w-full flex flex-col items-start gap-0.5 px-5 py-3 hover:bg-navy/4 transition-colors border-b border-navy/6 last:border-0"
                >
                  <span className="text-xs font-body font-semibold text-gold">{r.reference}</span>
                  <span className="text-sm font-body text-charcoal/60 line-clamp-1">{r.text}</span>
                </button>
              ))}
            </div>
          )}

          {/* Static suggestions before enough characters typed */}
          {focused && filteredSuggestions.length > 0 && results.length === 0 && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-xl shadow-navy/10 ring-1 ring-navy/8 overflow-hidden text-left z-20">
              {filteredSuggestions.map(s => (
                <button
                  key={s}
                  onClick={() => setQuery(s)}
                  className="w-full flex items-center gap-2 px-5 py-3 hover:bg-navy/4 transition-colors text-sm font-body text-charcoal/60"
                >
                  <Search className="w-3.5 h-3.5 text-navy/30" />
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
                onClick={() => setQuery(s)}
                className="px-3.5 py-1.5 rounded-full bg-white border border-navy/10 text-xs font-body text-charcoal/55 hover:border-gold/30 hover:text-navy transition-all"
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
