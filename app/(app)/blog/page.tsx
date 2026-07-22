'use client'
import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { Newspaper, Search, Clock } from 'lucide-react'
import Navigation from '@/components/layout/Navigation'
import Footer from '@/components/layout/Footer'

type Article = {
  id: string
  slug: string
  title: string
  subtitle: string | null
  resource_type: string
  estimated_reading_minutes: number | null
  published_at: string
  author:   { display_name: string }
  category: { slug: string; name: string }
}

export default function BlogPage() {
  const [articles, setArticles] = useState<Article[]>([])
  const [loading,   setLoading] = useState(true)
  const [error,     setError]   = useState<string | null>(null)
  const [search,    setSearch]  = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (search.trim()) params.set('q', search.trim())
      const res  = await fetch(`/api/v1/blog?${params.toString()}`)
      const body = await res.json()
      if (!body.success) throw new Error()
      setArticles(body.data)
    } catch {
      setError('Something went wrong loading the Blog. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [search])

  useEffect(() => { load() }, [load])

  return (
    <div className="min-h-screen bg-cream-gradient">
      <Navigation />
      <main className="max-w-3xl mx-auto px-4 py-10">
        <div className="flex items-center gap-3 mb-2">
          <Newspaper className="w-7 h-7 text-navy" />
          <h1 className="text-2xl font-serif text-navy">Blog &amp; Resources</h1>
        </div>
        <p className="text-navy/60 mb-8">Biblically grounded articles, study resources, and updates.</p>

        <div className="relative mb-8 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-navy/40" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search articles..."
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-navy/15 bg-white text-navy placeholder:text-navy/40 focus:outline-none focus:ring-2 focus:ring-gold/50"
          />
        </div>

        {loading && (
          <div className="flex justify-center py-16">
            <div className="w-6 h-6 border-2 border-navy/20 border-t-navy rounded-full animate-spin" />
          </div>
        )}

        {!loading && error && <div className="text-center py-16 text-navy/60">{error}</div>}

        {!loading && !error && articles.length === 0 && (
          <div className="text-center py-16 text-navy/50">
            <Newspaper className="w-10 h-10 mx-auto mb-3 opacity-40" />
            <p>No articles are published yet — check back soon.</p>
          </div>
        )}

        {!loading && !error && articles.length > 0 && (
          <ul className="space-y-3">
            {articles.map(a => (
              <li key={a.slug}>
                <Link
                  href={`/blog/${a.slug}`}
                  className="block p-5 rounded-xl bg-white hover:bg-cream border border-navy/8 hover:border-gold/20 transition-all duration-200"
                >
                  <span className="text-xs uppercase tracking-wide text-gold-dark">{a.category.name}</span>
                  <h3 className="font-serif text-lg text-navy mt-1">{a.title}</h3>
                  {a.subtitle && <p className="text-sm text-navy/60 mt-0.5">{a.subtitle}</p>}
                  <div className="flex items-center gap-3 mt-3 text-xs text-navy/40">
                    <span>{a.author.display_name}</span>
                    {a.estimated_reading_minutes && (
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {a.estimated_reading_minutes} min read
                      </span>
                    )}
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </main>
      <Footer />
    </div>
  )
}
