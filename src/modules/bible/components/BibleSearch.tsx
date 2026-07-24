'use client'
import { useState, useCallback, useRef, useEffect } from 'react'
import { Search, X, BookOpen, ArrowRight } from 'lucide-react'
import type { SearchResult } from '@/modules/bible/types'

type Props = {
  translation: string
  onSelectVerse: (result: SearchResult) => void
  onClose: () => void
}

const RECENT_KEY = 'bc_recent_searches'

export default function BibleSearch({ translation, onSelectVerse, onClose }: Props) {
  const [query,   setQuery]   = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [recent,  setRecent]  = useState<string[]>([])
  const inputRef  = useRef<HTMLInputElement>(null)
  const timerRef  = useRef<ReturnType<typeof setTimeout>>()

  useEffect(() => {
    inputRef.current?.focus()
    try {
      const stored = JSON.parse(localStorage.getItem(RECENT_KEY) ?? '[]')
      setRecent(stored.slice(0, 6))
    } catch { /* ignore */ }
  }, [])

  const search = useCallback(async (q: string) => {
    if (!q.trim() || q.length < 2) { setResults([]); return }
    setLoading(true)
    try {
      const res  = await fetch(`/api/v1/bible/search?q=${encodeURIComponent(q)}&translation=${translation}`)
      const data = await res.json()
      if (data.success) setResults(data.data.results ?? [])
    } catch { /* silent fail */ }
    finally { setLoading(false) }
  }, [translation])

  const handleChange = (value: string) => {
    setQuery(value)
    clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => search(value), 350)
  }

  const handleSelect = (result: SearchResult) => {
    // Save to recent searches
    try {
      const updated = [result.reference, ...recent.filter(r => r !== result.reference)].slice(0, 6)
      localStorage.setItem(RECENT_KEY, JSON.stringify(updated))
      setRecent(updated)
    } catch { /* ignore */ }
    onSelectVerse(result)
    onClose()
  }

  // Highlight matching words in result text
  const highlight = (text: string, q: string) => {
    if (!q.trim()) return text
    const regex = new RegExp(`(${q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi')
    const parts = text.split(regex)
    return parts.map((part, i) =>
      regex.test(part)
        ? <mark key={i} className="bg-gold/30 text-navy rounded px-0.5 not-italic">{part}</mark>
        : part
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* Search input */}
      <div className="p-4 border-b border-navy/8">
        <div className="relative flex items-center">
          <Search className="absolute left-3.5 w-4 h-4 text-navy/30 pointer-events-none" />
          <input
            ref={inputRef}
            type="search"
            value={query}
            onChange={e => handleChange(e.target.value)}
            placeholder="Search by reference, keyword, or topic…"
            className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-navy/15 focus:border-gold/50 focus:ring-2 focus:ring-gold/15 text-navy font-body text-sm outline-none bg-white transition-all"
          />
          {query && (
            <button
              onClick={() => { setQuery(''); setResults([]); inputRef.current?.focus() }}
              className="absolute right-3 text-charcoal/30 hover:text-navy transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Results */}
      <div className="flex-1 overflow-y-auto">

        {/* Loading skeleton */}
        {loading && (
          <div className="p-4 space-y-3">
            {[1,2,3].map(i => (
              <div key={i} className="animate-pulse">
                <div className="h-3 w-24 bg-navy/8 rounded mb-2" />
                <div className="h-4 w-full bg-navy/5 rounded" />
              </div>
            ))}
          </div>
        )}

        {/* Results list */}
        {!loading && results.length > 0 && (
          <div className="py-2">
            <div className="px-4 py-2">
              <span className="text-xs text-charcoal/35 font-body font-medium tracking-wider uppercase">
                {results.length} result{results.length !== 1 ? 's' : ''}
              </span>
            </div>
            {results.map(result => (
              <button
                key={result.verseId}
                onClick={() => handleSelect(result)}
                className="w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-navy/4 transition-colors group"
              >
                <BookOpen className="w-4 h-4 text-navy/25 shrink-0 mt-0.5 group-hover:text-gold transition-colors" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-xs font-body font-semibold text-gold">{result.reference}</span>
                    <span className="text-xs text-charcoal/30 font-body">{result.translation}</span>
                  </div>
                  <p className="text-sm text-charcoal/65 font-body leading-relaxed line-clamp-2">
                    {highlight(result.text, query)}
                  </p>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-navy/20 group-hover:text-navy/50 transition-colors shrink-0 mt-1" />
              </button>
            ))}
          </div>
        )}

        {/* No results */}
        {!loading && query.length >= 2 && results.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 px-8 text-center">
            <Search className="w-10 h-10 text-navy/15 mb-3" />
            <p className="font-body text-sm text-charcoal/50 mb-1">No results for &ldquo;{query}&rdquo;</p>
            <p className="font-body text-xs text-charcoal/35">Try a different word or Bible reference</p>
          </div>
        )}

        {/* Recent searches */}
        {!loading && !query && recent.length > 0 && (
          <div className="p-4">
            <p className="text-xs text-charcoal/35 font-body font-medium tracking-wider uppercase mb-3">Recent</p>
            <div className="flex flex-wrap gap-2">
              {recent.map(r => (
                <button
                  key={r}
                  onClick={() => { setQuery(r); handleChange(r) }}
                  className="px-3 py-1.5 rounded-full bg-navy/5 hover:bg-navy/10 text-navy/60 hover:text-navy text-xs font-body transition-all"
                >
                  {r}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Empty state */}
        {!loading && !query && recent.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 px-8 text-center">
            <Search className="w-10 h-10 text-navy/15 mb-3" />
            <p className="font-body text-sm text-charcoal/50 mb-1">Search Scripture</p>
            <p className="font-body text-xs text-charcoal/35">Try &ldquo;John 3:16&rdquo;, &ldquo;hope&rdquo;, or &ldquo;Psalm 23&rdquo;</p>
          </div>
        )}
      </div>
    </div>
  )
}