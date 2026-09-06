'use client'
import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { LibraryBig, ArrowLeft, ArrowRight } from 'lucide-react'
import Navigation from '@/components/layout/Navigation'
import Footer from '@/components/layout/Footer'
import SectionBody from '@/components/discipleship/SectionBody'

// Table of contents for one DiscipleshipBook -- the "read online" entry
// point from /books. Mirrors /topics/[slug]'s load/error/empty pattern.

type Section = { heading: string; body: string }
type ChapterSummary = { chapter_number: number; title: string; subtitle: string | null }
type BookDetail = {
  slug: string; title: string; subtitle: string | null; author_name: string
  description: string | null; theme_verse: string | null; summary_sections: Section[] | null
  chapters: ChapterSummary[]
}

export default function ReadBookPage({ params }: { params: { slug: string } }) {
  const [book,    setBook]    = useState<BookDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res  = await fetch(`/api/v1/books/read/${params.slug}`)
      const body = await res.json()
      if (res.status === 404) { setError('not_found'); return }
      if (!body.success) throw new Error()
      setBook(body.data)
    } catch {
      setError('This book couldn’t be loaded. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [params.slug])

  useEffect(() => { load() }, [load])

  return (
    <div className="min-h-screen bg-cream dark:bg-navy-dark-gradient">
      <Navigation />
      <main className="max-w-3xl mx-auto px-4 py-10">
        <Link href="/books" className="inline-flex items-center gap-1.5 text-sm text-navy/60 dark:text-cream/60 hover:text-navy dark:text-cream mb-6">
          <ArrowLeft className="w-4 h-4" /> All Books
        </Link>

        {loading && (
          <div className="flex justify-center py-16">
            <div className="w-6 h-6 border-2 border-navy/20 border-t-navy rounded-full animate-spin" />
          </div>
        )}

        {!loading && error === 'not_found' && (
          <div className="text-center py-16 text-navy/50 dark:text-cream/50">
            <LibraryBig className="w-10 h-10 mx-auto mb-3 opacity-40" />
            <p>This book doesn&rsquo;t exist or isn&rsquo;t published yet.</p>
          </div>
        )}

        {!loading && error && error !== 'not_found' && (
          <div className="text-center py-16 text-navy/60 dark:text-cream/60">{error}</div>
        )}

        {!loading && !error && book && (
          <>
            <h1 className="text-3xl font-serif text-navy dark:text-cream mb-1">{book.title}</h1>
            {book.subtitle && <p className="text-lg text-navy/70 dark:text-cream/70 font-body mb-2">{book.subtitle}</p>}
            <p className="text-sm text-charcoal/45 dark:text-cream/45 font-body mb-6">by {book.author_name}</p>
            {book.description && <p className="text-navy/70 dark:text-cream/70 leading-relaxed mb-6">{book.description}</p>}
            {book.theme_verse && (
              <blockquote className="border-l-2 border-gold/50 pl-4 italic text-navy/85 dark:text-cream/85 mb-8">
                <SectionBody body={book.theme_verse} />
              </blockquote>
            )}

            {book.chapters.length > 0 && (
              <Link href={`/books/read/${book.slug}/1`}
                className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-navy hover:bg-navy-light text-white text-sm font-body font-semibold transition-all mb-8">
                Start Reading <ArrowRight className="w-4 h-4" />
              </Link>
            )}

            <h2 className="text-sm font-medium uppercase tracking-wide text-navy/40 dark:text-cream/40 mb-3">
              Table of Contents
            </h2>
            <ol className="space-y-2">
              {book.chapters.map(c => (
                <li key={c.chapter_number}>
                  <Link href={`/books/read/${book.slug}/${c.chapter_number}`}
                    className="flex items-baseline gap-3 p-4 rounded-xl bg-white dark:bg-navy-dark border border-navy/8 hover:border-gold/30 transition-colors">
                    <span className="text-xs font-body font-semibold text-gold shrink-0">{c.chapter_number}</span>
                    <span>
                      <span className="block font-display text-sm font-semibold text-navy dark:text-cream">{c.title}</span>
                      {c.subtitle && <span className="block text-xs text-charcoal/50 dark:text-cream/50 font-body">{c.subtitle}</span>}
                    </span>
                  </Link>
                </li>
              ))}
            </ol>

            {book.summary_sections && book.summary_sections.length > 0 && (
              <div className="space-y-8 mt-12 pt-8 border-t border-navy/8">
                {book.summary_sections.map(section => (
                  <section key={section.heading}>
                    <h2 className="text-sm font-body font-semibold uppercase tracking-wide text-navy/50 dark:text-cream/50 mb-3">
                      {section.heading}
                    </h2>
                    <SectionBody body={section.body} />
                  </section>
                ))}
              </div>
            )}
          </>
        )}
      </main>
      <Footer />
    </div>
  )
}
