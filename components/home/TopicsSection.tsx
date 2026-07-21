'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

// Migrated from hardcoded mock data to the real Topics API (/api/v1/topics),
// PRD §4.29c. Only fields the API actually returns are rendered — the
// previous mock's `icon` emoji and `verses` count have no backing field in
// the real schema (DSD §2.45) and are not invented here.

type Topic = { id: string; slug: string; name: string; category: string; description: string }

const HOMEPAGE_LIMIT = 12 // Deterministic cap on API's own default ordering (name asc) — not curated.

export default function TopicsSection() {
  const [topics,  setTopics]  = useState<Topic[] | null>(null)
  const [error,   setError]   = useState(false)

  useEffect(() => {
    fetch('/api/v1/topics')
      .then(r => r.json())
      .then(body => {
        if (!body.success) throw new Error()
        setTopics(body.data)
      })
      .catch(() => setError(true))
  }, [])

  const visible = topics?.slice(0, HOMEPAGE_LIMIT) ?? []

  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-cream" aria-labelledby="topics-heading">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-10">
          <div>
            <h2 id="topics-heading" className="font-display text-3xl font-light text-navy mb-1">
              Scripture by Topic
            </h2>
            <p className="text-charcoal/50 font-body text-sm">
              Find what God&rsquo;s Word says about what matters to you.
            </p>
          </div>
          <Link
            href="/topics"
            className="hidden sm:inline-flex items-center gap-2 text-sm font-body font-medium text-gold hover:text-gold-dark transition-colors group"
          >
            All topics <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>

        {/* Loading */}
        {topics === null && !error && (
          <div className="flex justify-center py-10">
            <div className="w-6 h-6 border-2 border-navy/20 border-t-navy rounded-full animate-spin" />
          </div>
        )}

        {/* Error */}
        {error && (
          <p className="text-center text-charcoal/40 font-body text-sm py-10">
            Topics couldn&rsquo;t be loaded right now.
          </p>
        )}

        {/* Empty — honest, no invented examples */}
        {topics !== null && !error && visible.length === 0 && (
          <p className="text-center text-charcoal/40 font-body text-sm py-10">
            Topics are coming soon.
          </p>
        )}

        {/* Real data */}
        {visible.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {visible.map(topic => (
              <Link
                key={topic.slug}
                href={`/topics/${topic.slug}`}
                className="flex flex-col items-center justify-center p-4 rounded-2xl bg-white hover:bg-cream border border-navy/8 hover:border-gold/20 text-center transition-all duration-200 group hover:shadow-md hover:shadow-navy/8 hover:-translate-y-0.5"
              >
                <span className="font-body text-xs font-medium text-navy/80 group-hover:text-navy">{topic.name}</span>
              </Link>
            ))}
          </div>
        )}

        <div className="mt-6 sm:hidden text-center">
          <Link href="/topics" className="text-sm font-body font-medium text-gold hover:text-gold-dark transition-colors">
            View all topics →
          </Link>
        </div>
      </div>
    </section>
  )
}
