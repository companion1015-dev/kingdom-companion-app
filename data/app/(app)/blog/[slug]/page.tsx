'use client'
import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { Newspaper, ArrowLeft, Clock } from 'lucide-react'
import Navigation from '@/components/layout/Navigation'
import Footer from '@/components/layout/Footer'

type ArticleDetail = {
  id: string
  slug: string
  title: string
  subtitle: string | null
  content: string
  tags: string[]
  estimated_reading_minutes: number | null
  is_ai_assisted: boolean
  published_at: string
  author:   { display_name: string; bio: string | null }
  category: { name: string }
}

export default function BlogArticlePage({ params }: { params: { slug: string } }) {
  const [article, setArticle] = useState<ArticleDetail | null>(null)
  const [loading,  setLoading] = useState(true)
  const [error,    setError]   = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res  = await fetch(`/api/v1/blog/${params.slug}`)
      const body = await res.json()
      if (res.status === 404) { setError('not_found'); return }
      if (!body.success) throw new Error()
      setArticle(body.data)
    } catch {
      setError('This article couldn\u2019t be loaded. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [params.slug])

  useEffect(() => { load() }, [load])

  return (
    <div className="min-h-screen bg-cream-gradient">
      <Navigation />
      <main className="max-w-2xl mx-auto px-4 py-10">
        <Link href="/blog" className="inline-flex items-center gap-1.5 text-sm text-navy/60 hover:text-navy mb-6">
          <ArrowLeft className="w-4 h-4" /> Blog &amp; Resources
        </Link>

        {loading && (
          <div className="flex justify-center py-16">
            <div className="w-6 h-6 border-2 border-navy/20 border-t-navy rounded-full animate-spin" />
          </div>
        )}

        {!loading && error === 'not_found' && (
          <div className="text-center py-16 text-navy/50">
            <Newspaper className="w-10 h-10 mx-auto mb-3 opacity-40" />
            <p>This article doesn&rsquo;t exist or isn&rsquo;t published yet.</p>
          </div>
        )}

        {!loading && error && error !== 'not_found' && (
          <div className="text-center py-16 text-navy/60">{error}</div>
        )}

        {!loading && !error && article && (
          <article>
            <span className="text-xs uppercase tracking-wide text-gold-dark">{article.category.name}</span>
            <h1 className="text-3xl font-serif text-navy mt-1 mb-2">{article.title}</h1>
            {article.subtitle && <p className="text-navy/60 text-lg mb-4">{article.subtitle}</p>}

            <div className="flex items-center gap-3 mb-8 text-sm text-navy/50">
              <span>{article.author.display_name}</span>
              {article.estimated_reading_minutes && (
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" /> {article.estimated_reading_minutes} min read
                </span>
              )}
            </div>

            {article.is_ai_assisted && (
              <div className="mb-6 px-4 py-3 rounded-lg bg-navy/5 text-navy/60 text-sm">
                This article was created with AI assistance and reviewed by our editorial team before publishing.
              </div>
            )}

            <div className="prose prose-navy max-w-none text-navy/80 leading-relaxed whitespace-pre-wrap">
              {article.content}
            </div>

            {article.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-8 pt-6 border-t border-navy/8">
                {article.tags.map(t => (
                  <span key={t} className="px-2.5 py-1 rounded-full bg-navy/5 text-navy/60 text-xs">{t}</span>
                ))}
              </div>
            )}
          </article>
        )}
      </main>
      <Footer />
    </div>
  )
}
