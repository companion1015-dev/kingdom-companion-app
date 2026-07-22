'use client'
import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { Compass, Search } from 'lucide-react'
import Navigation from '@/components/layout/Navigation'
import Footer from '@/components/layout/Footer'

// PRD §4.29c — Topics Discovery Module. Public, no account required.

type Topic = {
  id: string
  slug: string
  name: string
  category: string
  description: string
}

export default function TopicsPage() {
  const [topics,  setTopics]  = useState<Topic[]>([])
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState<string | null>(null)
  const [search,  setSearch]  = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams()
      if (search.trim()) params.set('q', search.trim())
      const res  = await fetch(`/api/v1/topics?${params.toString()}`)
      const body = await res.json()
      if (!body.success) throw new Error(body.error?.message ?? 'Failed to load')
      setTopics(body.data)
    } catch {
      setError('Something went wrong loading Topics. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [search])

  useEffect(() => { load() }, [load])

  return (
    <div className="min-h-screen bg-cream-gradient">
      <Navigation />
      <main className="max-w-5xl mx-auto px-4 py-10">
        <div className="flex items-center gap-3 mb-2">
          <Compass className="w-7 h-7 text-navy" />
          <h1 className="text-2xl font-serif text-navy">Topics</h1>
        </div>
        <p className="text-navy/60 mb-8">
          Explore what Scripture says about what&rsquo;s on your heart.
        </p>

        <div className="relative mb-8 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-navy/40" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search topics..."
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-navy/15 bg-white text-navy placeholder:text-navy/40 focus:outline-none focus:ring-2 focus:ring-gold/50"
          />
        </div>

        {loading && (
          <div className="flex justify-center py-16">
            <div className="w-6 h-6 border-2 border-navy/20 border-t-navy rounded-full animate-spin" />
          </div>
        )}

        {!loading && error && (
          <div className="text-center py-16 text-navy/60">{error}</div>
        )}

        {!loading && !error && topics.length === 0 && (
          <div className="text-center py-16 text-navy/50">
            <Compass className="w-10 h-10 mx-auto mb-3 opacity-40" />
            <p>No topics are published yet — check back soon.</p>
          </div>
        )}

        {!loading && !error && topics.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {topics.map(t => (
              <Link
                key={t.slug}
                href={`/topics/${t.slug}`}
                className="p-4 rounded-2xl bg-white hover:bg-cream border border-navy/8 hover:border-gold/20 text-center transition-all duration-200 hover:shadow-md hover:-translate-y-0.5"
              >
                <span className="font-body text-sm font-medium text-navy/80">{t.name}</span>
              </Link>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  )
}
