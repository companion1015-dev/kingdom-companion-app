'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowRight, BookMarked, Clock } from 'lucide-react'

// Devotional half: migrated from hardcoded mock data to the real Devotionals
// API (/api/v1/devotionals), PRD §4.44.
//
// Reading Plans half: NOW ALSO REAL — migrated this session to the real
// /api/v1/reading-plans API, now that a working backend and detail route
// (/reading-plans/{id}) exist. This closes the gap flagged in the previous
// session's report.

type Series = {
  id: string
  slug: string
  title: string
  category: string
  description: string | null
  duration_days: number
}

type Plan = { id: string; title: string; description: string | null; duration_days: number; difficulty: string }

export default function DevotionalSection() {
  const [series, setSeries] = useState<Series[] | null>(null)
  const [error,  setError]  = useState(false)
  const [plans,      setPlans]      = useState<Plan[] | null>(null)
  const [plansError, setPlansError] = useState(false)

  useEffect(() => {
    fetch('/api/v1/devotionals')
      .then(r => r.json())
      .then(body => {
        if (!body.success) throw new Error()
        setSeries(body.data)
      })
      .catch(() => setError(true))
  }, [])

  useEffect(() => {
    fetch('/api/v1/reading-plans')
      .then(r => r.json())
      .then(body => {
        if (!body.success) throw new Error()
        setPlans(body.data)
      })
      .catch(() => setPlansError(true))
  }, [])

  // Not "featured" by editorial curation — the API has no such flag (DSD
  // §2.49 has no is_featured column). This is simply the first result of the
  // API's own ordering (title asc), taken transparently, not invented.
  const highlighted = series?.[0] ?? null

  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-cream" aria-labelledby="devotional-heading">
      <div className="max-w-7xl mx-auto">

        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">

          {/* Devotional Library — real data */}
          <div>
            <div className="flex items-center gap-2 mb-6">
              <BookMarked className="w-4 h-4 text-navy/50" />
              <span className="text-xs font-body font-medium tracking-widest uppercase text-navy/50">
                From the Devotional Library
              </span>
            </div>

            {/* Loading */}
            {series === null && !error && (
              <div className="flex justify-center py-10">
                <div className="w-6 h-6 border-2 border-navy/20 border-t-navy rounded-full animate-spin" />
              </div>
            )}

            {/* Error */}
            {error && (
              <p className="text-charcoal/40 font-body text-sm py-10">
                The Devotional Library couldn&rsquo;t be loaded right now.
              </p>
            )}

            {/* Empty — honest, no invented examples */}
            {series !== null && !error && !highlighted && (
              <p className="text-charcoal/40 font-body text-sm py-10">
                Devotional series are coming soon.
              </p>
            )}

            {/* Real data */}
            {highlighted && (
              <div
                className="rounded-2xl overflow-hidden group cursor-pointer"
                style={{ border: '1px solid rgba(27,58,92,0.10)' }}
              >
                <div
                  className="p-8 text-white relative overflow-hidden"
                  style={{ background: 'linear-gradient(135deg, #1B3A5C 0%, #2A5080 50%, #1a3850 100%)' }}
                >
                  <div className="absolute top-4 right-4 opacity-10 font-display text-8xl leading-none select-none">✝</div>
                  <span className="inline-block px-3 py-1 rounded-full text-xs font-body font-medium bg-gold/20 text-gold border border-gold/30 mb-4">
                    {highlighted.duration_days} days
                  </span>
                  <h2 id="devotional-heading" className="font-display text-3xl font-semibold text-white mb-2">
                    {highlighted.title}
                  </h2>
                  <p className="text-white/60 font-body text-sm">{highlighted.category}</p>
                </div>

                <div className="p-8 bg-white">
                  {highlighted.description && (
                    <p className="text-charcoal/65 font-body text-sm leading-relaxed mb-6">
                      {highlighted.description}
                    </p>
                  )}

                  <Link
                    href={`/devotionals/${highlighted.slug}`}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-navy hover:bg-navy-light text-white rounded-full text-sm font-body font-medium transition-all duration-200 group"
                  >
                    Begin this devotional
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* Reading Plans — real data, /api/v1/reading-plans */}
          <div>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-navy/50" />
                <span className="text-xs font-body font-medium tracking-widest uppercase text-navy/50">Reading Plans</span>
              </div>
              <Link href="/reading-plans" className="text-xs text-gold hover:text-gold-dark font-body font-medium transition-colors">
                View all plans →
              </Link>
            </div>

            {/* Loading */}
            {plans === null && !plansError && (
              <div className="flex justify-center py-6">
                <div className="w-5 h-5 border-2 border-navy/20 border-t-navy rounded-full animate-spin" />
              </div>
            )}

            {/* Error */}
            {plansError && (
              <p className="text-charcoal/40 font-body text-sm py-6">
                Reading plans couldn&rsquo;t be loaded right now.
              </p>
            )}

            {/* Empty — honest, no invented examples */}
            {plans !== null && !plansError && plans.length === 0 && (
              <p className="text-charcoal/40 font-body text-sm py-6">
                Reading plans are coming soon.
              </p>
            )}

            {/* Real data — capped to a deterministic 4 for homepage preview */}
            {plans !== null && plans.length > 0 && (
              <div className="space-y-3">
                {plans.slice(0, 4).map((plan, i) => (
                  <Link
                    key={plan.id}
                    href={`/reading-plans/${plan.id}`}
                    className="flex items-center gap-4 p-5 rounded-xl bg-white hover:bg-cream border border-navy/8 hover:border-gold/20 transition-all duration-200 group"
                  >
                    <div className="w-9 h-9 rounded-full bg-navy/6 flex items-center justify-center shrink-0 group-hover:bg-navy/10 transition-colors">
                      <span className="font-display text-sm font-semibold text-navy/50">{i + 1}</span>
                    </div>

                    <div className="flex-1 min-w-0">
                      <h3 className="font-body text-sm font-medium text-navy truncate mb-0.5">{plan.title}</h3>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-charcoal/40">{plan.duration_days} days</span>
                        <span className="w-1 h-1 rounded-full bg-charcoal/20" />
                        <span className="text-xs text-charcoal/40 capitalize">{plan.difficulty}</span>
                      </div>
                    </div>

                    <ArrowRight className="w-4 h-4 text-navy/25 group-hover:text-gold group-hover:translate-x-0.5 transition-all shrink-0" />
                  </Link>
                ))}
              </div>
            )}

            <div className="mt-6 p-6 rounded-2xl bg-gradient-to-br from-sage/15 to-sage/5 border border-sage/20">
              <p className="font-display italic text-navy text-base mb-1 leading-snug">
                &ldquo;Your word is a lamp for my feet, a light on my path.&rdquo;
              </p>
              <p className="text-xs text-charcoal/45 font-body mb-4">— Psalm 119:105</p>
              <Link
                href="/bible"
                className="inline-flex items-center gap-2 text-sm font-body font-medium text-sage-dark hover:text-navy transition-colors group"
              >
                Open the Bible <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
