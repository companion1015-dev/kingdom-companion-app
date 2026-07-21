'use client'
import { useState } from 'react'
import { Search, ArrowRight } from 'lucide-react'

const suggestions = ['John 3:16', 'Psalm 23', 'Anxiety', 'Romans 8', 'Hope', 'Forgiveness', 'Fear', 'Isaiah 40:31']

export default function SearchSection() {
  const [query, setQuery]     = useState('')
  const [focused, setFocused] = useState(false)

  const filtered = query.length >= 2
    ? suggestions.filter(s => s.toLowerCase().includes(query.toLowerCase()))
    : []

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
              placeholder="Try: 'Psalm 23', 'anxiety', 'Moses', 'hope'…"
              className="w-full pl-14 pr-14 py-4 bg-transparent text-navy font-body text-base placeholder-charcoal/30 outline-none rounded-2xl"
              aria-label="Search the Bible"
            />
            <button
              className="absolute right-3 p-2.5 bg-navy hover:bg-navy-light text-white rounded-xl transition-colors"
              aria-label="Search"
              onClick={() => query.trim() && alert(`Searching for: ${query}`)}
            >
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* Autocomplete dropdown */}
          {focused && filtered.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl shadow-navy/15 border border-navy/8 overflow-hidden z-20">
              {filtered.map(suggestion => (
                <button
                  key={suggestion}
                  className="w-full flex items-center gap-3 px-5 py-3 text-left hover:bg-cream transition-colors group"
                  onClick={() => { setQuery(suggestion); setFocused(false) }}
                >
                  <Search className="w-3.5 h-3.5 text-navy/25 shrink-0" />
                  <span className="font-body text-sm text-navy/70 group-hover:text-navy">{suggestion}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Popular topics */}
        <div className="flex flex-wrap justify-center gap-2 mt-6">
          {suggestions.slice(0, 6).map(topic => (
            <button
              key={topic}
              onClick={() => setQuery(topic)}
              className="px-3 py-1.5 text-xs font-body text-navy/55 hover:text-navy bg-white hover:bg-cream border border-navy/10 hover:border-navy/20 rounded-full transition-all"
            >
              {topic}
            </button>
          ))}
        </div>
      </div>
    </section>
  )
}
