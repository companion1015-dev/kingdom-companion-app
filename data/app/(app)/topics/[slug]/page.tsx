'use client'
import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { Compass, ArrowLeft } from 'lucide-react'
import Navigation from '@/components/layout/Navigation'
import Footer from '@/components/layout/Footer'

type TopicVerse = { id: string; verse_reference: string; verse_id: string; book_id: string; chapter: number }
type TopicDetail = { id: string; slug: string; name: string; category: string; description: string; verses: TopicVerse[] }

export default function TopicDetailPage({ params }: { params: { slug: string } }) {
  const [topic,   setTopic]   = useState<TopicDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res  = await fetch(`/api/v1/topics/${params.slug}`)
      const body = await res.json()
      if (res.status === 404) { setError('not_found'); return }
      if (!body.success) throw new Error()
      setTopic(body.data)
    } catch {
      setError('This topic couldn\u2019t be loaded. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [params.slug])

  useEffect(() => { load() }, [load])

  return (
    <div className="min-h-screen bg-cream-gradient">
      <Navigation />
      <main className="max-w-3xl mx-auto px-4 py-10">
        <Link href="/topics" className="inline-flex items-center gap-1.5 text-sm text-navy/60 hover:text-navy mb-6">
          <ArrowLeft className="w-4 h-4" /> All Topics
        </Link>

        {loading && (
          <div className="flex justify-center py-16">
            <div className="w-6 h-6 border-2 border-navy/20 border-t-navy rounded-full animate-spin" />
          </div>
        )}

        {!loading && error === 'not_found' && (
          <div className="text-center py-16 text-navy/50">
            <Compass className="w-10 h-10 mx-auto mb-3 opacity-40" />
            <p>This topic doesn&rsquo;t exist or isn&rsquo;t published yet.</p>
          </div>
        )}

        {!loading && error && error !== 'not_found' && (
          <div className="text-center py-16 text-navy/60">{error}</div>
        )}

        {!loading && !error && topic && (
          <>
            <h1 className="text-3xl font-serif text-navy mb-2">{topic.name}</h1>
            <p className="text-navy/60 mb-8 leading-relaxed">{topic.description}</p>

            <h2 className="text-sm font-medium uppercase tracking-wide text-navy/40 mb-3">
              Related Scripture
            </h2>
            {topic.verses.length === 0 ? (
              <p className="text-navy/50 text-sm">No verses have been linked to this topic yet.</p>
            ) : (
              <ul className="space-y-2">
                {topic.verses.map(v => (
                  <li key={v.id}>
                    {/* NOTE: linking to /bible?ref= here would be non-functional today —
                        the Bible page does not currently parse any query params.
                        Linking to the plain reader instead until that's implemented.
                        ASSUMPTION — REQUIRES PRODUCT DECISION: whether verse deep-linking
                        from Topics is a near-term priority; flagged as a real follow-up. */}
                    <Link
                      href="/bible"
                      className="block p-4 rounded-xl bg-white border border-navy/8 hover:border-gold/20 transition-colors"
                    >
                      <span className="font-medium text-navy">{v.verse_reference}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </main>
      <Footer />
    </div>
  )
}
