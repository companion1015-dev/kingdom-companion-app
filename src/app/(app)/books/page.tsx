'use client'
import { useState, useEffect } from 'react'
import Image from 'next/image'
import { LibraryBig, Download, FileText } from 'lucide-react'
import Navigation from '@/components/layout/Navigation'
import Footer from '@/components/layout/Footer'

// Genuinely new page -- books/manuscripts an admin has written had nowhere
// to go before this. Distinct from /devotionals (multi-day series typed
// into the CMS) and /blog (inline article text): these are whole files
// (PDF/EPUB/DOCX) uploaded from the admin's own computer.

type LibraryBook = {
  id: string; title: string; author_name: string; description: string | null
  cover_image_url: string | null; file_url: string; file_type: string; created_at: string
}

export default function BooksPage() {
  const [books,   setBooks]   = useState<LibraryBook[]>([])
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/v1/books')
      .then(r => r.json())
      .then(body => {
        if (!body.success) throw new Error()
        setBooks(body.data)
      })
      .catch(() => setError('Something went wrong loading Books. Please try again.'))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="min-h-screen bg-cream dark:bg-navy-dark-gradient">
      <Navigation />
      <main className="max-w-3xl mx-auto px-4 py-10">
        <div className="flex items-center gap-3 mb-2">
          <LibraryBig className="w-7 h-7 text-navy dark:text-cream" />
          <h1 className="text-2xl font-serif text-navy dark:text-cream">Books</h1>
        </div>
        <p className="text-navy/60 dark:text-cream/60 mb-8">Books and resources available to read or download.</p>

        {loading && (
          <div className="flex justify-center py-16">
            <div className="w-6 h-6 border-2 border-navy/20 border-t-navy rounded-full animate-spin" />
          </div>
        )}

        {!loading && error && <div className="text-center py-16 text-navy/60 dark:text-cream/60">{error}</div>}

        {!loading && !error && books.length === 0 && (
          <div className="text-center py-16 text-navy/50 dark:text-cream/50">
            <LibraryBig className="w-10 h-10 mx-auto mb-3 opacity-40" />
            <p>No books are published yet — check back soon.</p>
          </div>
        )}

        {!loading && !error && books.length > 0 && (
          <ul className="space-y-3">
            {books.map(b => (
              <li key={b.id} className="flex items-start gap-4 p-5 rounded-xl bg-white dark:bg-navy-dark border border-navy/8">
                <div className="w-16 h-20 rounded-lg overflow-hidden bg-navy/5 shrink-0 relative">
                  {b.cover_image_url ? (
                    <Image src={b.cover_image_url} alt={b.title} fill className="object-cover" sizes="64px" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <FileText className="w-6 h-6 text-navy/25 dark:text-cream/25" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="font-display text-base font-semibold text-navy dark:text-cream">{b.title}</h2>
                  <p className="text-xs text-charcoal/45 dark:text-cream/45 font-body mb-1.5">by {b.author_name}</p>
                  {b.description && <p className="text-sm text-charcoal/60 dark:text-cream/60 font-body line-clamp-2 mb-3">{b.description}</p>}
                  <a href={b.file_url} target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-navy hover:bg-navy-light text-white text-xs font-body font-semibold transition-all">
                    <Download className="w-3.5 h-3.5" /> Download {b.file_type.toUpperCase()}
                  </a>
                </div>
              </li>
            ))}
          </ul>
        )}
      </main>
      <Footer />
    </div>
  )
}
