'use client'
import { useState, useEffect, useCallback, Fragment } from 'react'
import Link from 'next/link'
import { LibraryBig, ArrowLeft, ArrowRight, ChevronLeft } from 'lucide-react'
import Navigation from '@/components/layout/Navigation'
import Footer from '@/components/layout/Footer'
import SectionBody from '@/components/discipleship/SectionBody'

type Section = { heading: string; body: string }
type Topic = { topic_number: number; title: string; sections: Section[] }
type ChapterDetail = {
  book: { slug: string; title: string; subtitle: string | null }
  chapter: {
    chapter_number: number; title: string; subtitle: string | null
    theme_verse: string | null; sections: Section[]; topics: Topic[] | null
  }
  totalChapters: number
  prev: { chapter_number: number; title: string } | null
  next: { chapter_number: number; title: string } | null
}

export default function ReadChapterPage({ params }: { params: { slug: string; chapter: string } }) {
  const [data,    setData]    = useState<ChapterDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res  = await fetch(`/api/v1/books/read/${params.slug}/${params.chapter}`)
      const body = await res.json()
      if (res.status === 404) { setError('not_found'); return }
      if (!body.success) throw new Error()
      setData(body.data)
      window.scrollTo({ top: 0 })
    } catch {
      setError('This chapter couldn’t be loaded. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [params.slug, params.chapter])

  useEffect(() => { load() }, [load])

  return (
    <div className="min-h-screen bg-cream dark:bg-navy-dark-gradient">
      <Navigation />
      <main className="max-w-2xl mx-auto px-4 py-10">
        <Link href={`/books/read/${params.slug}`} className="inline-flex items-center gap-1.5 text-sm text-navy/60 dark:text-cream/60 hover:text-navy dark:text-cream mb-6">
          <ArrowLeft className="w-4 h-4" /> Table of Contents
        </Link>

        {loading && (
          <div className="flex justify-center py-16">
            <div className="w-6 h-6 border-2 border-navy/20 border-t-navy rounded-full animate-spin" />
          </div>
        )}

        {!loading && error === 'not_found' && (
          <div className="text-center py-16 text-navy/50 dark:text-cream/50">
            <LibraryBig className="w-10 h-10 mx-auto mb-3 opacity-40" />
            <p>This chapter doesn&rsquo;t exist.</p>
          </div>
        )}

        {!loading && error && error !== 'not_found' && (
          <div className="text-center py-16 text-navy/60 dark:text-cream/60">{error}</div>
        )}

        {!loading && !error && data && (
          <Fragment>
            <p className="text-xs font-body font-semibold uppercase tracking-wide text-gold mb-2">
              {data.book.title} · Chapter {data.chapter.chapter_number} of {data.totalChapters}
            </p>
            <h1 className="text-3xl font-serif text-navy dark:text-cream mb-1">{data.chapter.title}</h1>
            {data.chapter.subtitle && <p className="text-lg text-navy/70 dark:text-cream/70 font-body mb-4">{data.chapter.subtitle}</p>}
            {data.chapter.theme_verse && (
              <blockquote className="border-l-2 border-gold/50 pl-4 italic text-navy/85 dark:text-cream/85 mb-8">
                <SectionBody body={data.chapter.theme_verse} />
              </blockquote>
            )}

            <div className="space-y-8">
              {data.chapter.sections.map(section => (
                <section key={section.heading}>
                  <h2 className="text-sm font-body font-semibold uppercase tracking-wide text-navy/50 dark:text-cream/50 mb-3">
                    {section.heading}
                  </h2>
                  <SectionBody body={section.body} />
                </section>
              ))}
            </div>

            {data.chapter.topics && data.chapter.topics.length > 0 && (
              <div className="space-y-12 mt-10">
                {data.chapter.topics.map(topic => (
                  <div key={topic.topic_number} className="pt-8 border-t border-navy/8">
                    <p className="text-xs font-body font-semibold uppercase tracking-wide text-gold mb-1">
                      Topic {topic.topic_number}
                    </p>
                    <h2 className="text-2xl font-serif text-navy dark:text-cream mb-6">{topic.title}</h2>
                    <div className="space-y-8">
                      {topic.sections.map(section => (
                        <section key={section.heading}>
                          <h3 className="text-sm font-body font-semibold uppercase tracking-wide text-navy/50 dark:text-cream/50 mb-3">
                            {section.heading}
                          </h3>
                          <SectionBody body={section.body} />
                        </section>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <nav className="flex items-center justify-between gap-4 mt-12 pt-6 border-t border-navy/8">
              {data.prev ? (
                <Link href={`/books/read/${params.slug}/${data.prev.chapter_number}`}
                  className="flex-1 flex items-center gap-1.5 px-4 py-3 rounded-xl bg-white dark:bg-navy-dark border border-navy/8 hover:border-gold/30 transition-colors text-sm">
                  <ChevronLeft className="w-4 h-4 shrink-0 text-navy/40 dark:text-cream/40" />
                  <span className="min-w-0">
                    <span className="block text-[10px] uppercase tracking-wide text-charcoal/40 dark:text-cream/40">Previous</span>
                    <span className="block truncate text-navy dark:text-cream font-body">{data.prev.title}</span>
                  </span>
                </Link>
              ) : <div className="flex-1" />}
              {data.next ? (
                <Link href={`/books/read/${params.slug}/${data.next.chapter_number}`}
                  className="flex-1 flex items-center justify-end gap-1.5 px-4 py-3 rounded-xl bg-white dark:bg-navy-dark border border-navy/8 hover:border-gold/30 transition-colors text-sm text-right">
                  <span className="min-w-0">
                    <span className="block text-[10px] uppercase tracking-wide text-charcoal/40 dark:text-cream/40">Next</span>
                    <span className="block truncate text-navy dark:text-cream font-body">{data.next.title}</span>
                  </span>
                  <ArrowRight className="w-4 h-4 shrink-0 text-navy/40 dark:text-cream/40" />
                </Link>
              ) : <div className="flex-1" />}
            </nav>
          </Fragment>
        )}
      </main>
      <Footer />
    </div>
  )
}
