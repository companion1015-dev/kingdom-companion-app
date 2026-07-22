'use client'
import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { BookOpen, Bookmark, Share2, ChevronLeft, ChevronRight, Clock, MessageSquare, Pen, ArrowRight } from 'lucide-react'
import Navigation from '@/components/layout/Navigation'
import Footer from '@/components/layout/Footer'
import type { DailyEntry } from '@/modules/daily/data/entries'

export default function DailyPage() {
  const [entry,     setEntry]     = useState<DailyEntry | null>(null)
  const [offset,    setOffset]    = useState(0)
  const [loading,   setLoading]   = useState(true)
  const [bookmarked,setBookmarked]= useState(false)
  const [toast,     setToast]     = useState<string | null>(null)
  const [tab,       setTab]       = useState<'reflection' | 'prayer' | 'journal'>('reflection')

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 2500) }

  useEffect(() => {
    setLoading(true)
    fetch(`/api/v1/daily?offset=${offset}`)
      .then(r => r.json())
      .then(d => { if (d.success) setEntry(d.data) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [offset])

  const handleBookmark = () => {
    setBookmarked(b => !b)
    showToast(bookmarked ? 'Bookmark removed' : 'Day bookmarked')
  }

  const handleShare = async () => {
    if (!entry) return
    const text = `"${entry.verse.text}" — ${entry.verse.reference}\n\nRead today's devotional at Kingdom Companion`
    try {
      if (navigator.share) {
        await navigator.share({ title: entry.title, text, url: window.location.href })
      } else {
        await navigator.clipboard.writeText(text)
        showToast('Scripture copied to clipboard')
      }
    } catch { /* user cancelled */ }
  }

  const today = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })

  return (
    <>
      <Navigation />
      <main className="min-h-screen bg-cream pt-16">

        {/* Hero header */}
        <div className="bg-hero-gradient relative overflow-hidden">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full opacity-[0.05]"
            style={{ background: 'radial-gradient(circle, #C9A84C 0%, transparent 70%)' }}
          />
          <div className="relative max-w-3xl mx-auto px-4 sm:px-6 py-12 text-center">
            <div className="flex items-center justify-center gap-2 mb-4">
              <div className="w-px h-4 bg-white/20" />
              <span className="text-xs font-body font-medium text-white/45 tracking-widest uppercase">Daily Encouragement</span>
              <div className="w-px h-4 bg-white/20" />
            </div>
            <p className="text-gold/70 font-body text-xs tracking-widest uppercase mb-2">{today}</p>

            {loading ? (
              <div className="animate-pulse space-y-3">
                <div className="h-8 bg-white/10 rounded-xl mx-auto w-3/4" />
                <div className="h-4 bg-white/8 rounded mx-auto w-1/2" />
              </div>
            ) : entry && (
              <>
                <h1 className="font-display text-3xl sm:text-4xl font-light text-white mb-2">{entry.title}</h1>
                <p className="text-white/45 font-body text-sm mb-8">{entry.theme}</p>

                {/* Daily verse — hero card */}
                <div className="bg-white/8 border border-white/12 rounded-2xl p-6 sm:p-8 text-left mx-auto max-w-2xl backdrop-blur-sm">
                  <span className="text-gold/60 font-display text-6xl leading-none select-none">&ldquo;</span>
                  <p className="font-display text-lg sm:text-xl italic text-white leading-relaxed -mt-4 mb-4">
                    {entry.verse.text}
                  </p>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gold font-body font-semibold text-sm">{entry.verse.reference}</p>
                      <p className="text-white/35 font-body text-xs">{entry.verse.translation}</p>
                    </div>
                    <div className="flex items-center gap-1.5 text-white/30 font-body text-xs">
                      <Clock className="w-3 h-3" />
                      {entry.readingTime} min read
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-center gap-3 mt-6">
                  <button onClick={handleBookmark}
                    className={`flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-body font-medium transition-all ${bookmarked ? 'bg-gold text-navy border-gold' : 'border-white/20 text-white/70 hover:border-white/40 hover:text-white'}`}>
                    <Bookmark className={`w-3.5 h-3.5 ${bookmarked ? 'fill-current' : ''}`} />
                    {bookmarked ? 'Bookmarked' : 'Bookmark'}
                  </button>
                  <button onClick={handleShare}
                    className="flex items-center gap-2 px-4 py-2 rounded-full border border-white/20 text-white/70 hover:border-white/40 hover:text-white text-sm font-body font-medium transition-all">
                    <Share2 className="w-3.5 h-3.5" /> Share
                  </button>
                  <Link href={`/bible`}
                    className="flex items-center gap-2 px-4 py-2 rounded-full border border-white/20 text-white/70 hover:border-white/40 hover:text-white text-sm font-body font-medium transition-all">
                    <BookOpen className="w-3.5 h-3.5" /> Read in Bible
                  </Link>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Content tabs */}
        {!loading && entry && (
          <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">

            {/* Tab bar */}
            <div className="flex bg-white rounded-2xl p-1.5 border border-navy/8 mb-6 shadow-sm">
              {([
                { id: 'reflection' as const, label: 'Reflection',  icon: MessageSquare },
                { id: 'prayer'     as const, label: 'Prayer',      icon: BookOpen      },
                { id: 'journal'    as const, label: 'Journal',     icon: Pen           },
              ]).map(({ id, label, icon: Icon }) => (
                <button key={id} onClick={() => setTab(id)}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-body font-medium transition-all ${tab === id ? 'bg-navy text-white shadow-md' : 'text-charcoal/45 hover:text-navy hover:bg-navy/4'}`}>
                  <Icon className="w-3.5 h-3.5" /> {label}
                </button>
              ))}
            </div>

            {/* Reflection tab */}
            {tab === 'reflection' && (
              <div className="space-y-5">
                {/* Reflection */}
                <div className="bg-white rounded-2xl border border-navy/8 p-6 sm:p-8">
                  <h2 className="font-display text-xl font-semibold text-navy mb-4">Reflection</h2>
                  {entry.reflection.split('\n\n').map((para, i) => (
                    <p key={i} className="text-charcoal/70 font-body text-sm leading-relaxed mb-4 last:mb-0">{para}</p>
                  ))}
                </div>

                {/* Today's challenge */}
                <div className="bg-navy rounded-2xl p-6 relative overflow-hidden">
                  <div className="absolute top-4 right-4 opacity-10 font-display text-6xl select-none">✝</div>
                  <div className="relative">
                    <span className="text-xs font-body font-semibold text-gold/70 tracking-widest uppercase block mb-2">Today&rsquo;s Challenge</span>
                    <p className="text-white font-body text-sm leading-relaxed mb-4">{entry.challenge}</p>
                    <div className="h-px bg-white/10 mb-4" />
                    <span className="text-xs font-body font-semibold text-white/40 tracking-widest uppercase block mb-2">Reflection Question</span>
                    <p className="text-white/70 font-display italic text-base leading-relaxed">{entry.reflectionQ}</p>
                  </div>
                </div>

                {/* Suggested reading */}
                <div className="flex items-center gap-4 p-5 bg-white rounded-2xl border border-navy/8">
                  <div className="w-10 h-10 rounded-xl bg-navy/8 flex items-center justify-center shrink-0">
                    <BookOpen className="w-5 h-5 text-navy/50" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-body font-semibold text-navy/40 tracking-widest uppercase mb-0.5">Suggested Reading</p>
                    <p className="font-body font-medium text-navy text-sm">{entry.suggestedReading}</p>
                  </div>
                  <Link href="/bible" className="flex items-center gap-1.5 text-gold hover:text-gold-dark text-xs font-body font-semibold transition-colors">
                    Open <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            )}

            {/* Prayer tab */}
            {tab === 'prayer' && (
              <div className="bg-white rounded-2xl border border-navy/8 p-6 sm:p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="relative w-8 h-8 rounded-lg overflow-hidden">
                    <Image src="/images/logo.png" alt="" fill className="object-cover" sizes="32px" />
                  </div>
                  <div>
                    <h2 className="font-display text-xl font-semibold text-navy">Guided Prayer</h2>
                    <p className="text-xs text-charcoal/40 font-body">Pray this aloud or silently</p>
                  </div>
                </div>
                <div className="border-l-4 border-gold/40 pl-5">
                  {entry.prayer.split('\n').filter(Boolean).map((line, i) => (
                    <p key={i} className="font-display italic text-navy text-base leading-relaxed mb-3 last:mb-0">{line}</p>
                  ))}
                </div>
                <div className="mt-6 pt-5 border-t border-navy/8 text-center">
                  <p className="text-xs text-charcoal/35 font-body mb-3">Want to continue in prayer?</p>
                  <Link href="/companion" className="inline-flex items-center gap-2 px-5 py-2.5 bg-navy hover:bg-navy-light text-white text-sm font-body font-medium rounded-full transition-colors">
                    Open AI Companion
                  </Link>
                </div>
              </div>
            )}

            {/* Journal tab */}
            {tab === 'journal' && (
              <div className="bg-white rounded-2xl border border-navy/8 p-6 sm:p-8">
                <h2 className="font-display text-xl font-semibold text-navy mb-2">Journal Prompt</h2>
                <p className="text-charcoal/50 font-body text-sm mb-6 leading-relaxed">{entry.journalPrompt}</p>
                <textarea
                  placeholder="Write your thoughts, prayers, or reflections here…"
                  rows={8}
                  className="w-full p-4 rounded-xl border border-navy/10 focus:border-gold/40 focus:ring-2 focus:ring-gold/10 text-navy font-body text-sm leading-relaxed outline-none resize-none transition-all bg-cream/50"
                  style={{ caretColor: '#C9A84C' }}
                />
                <div className="flex items-center justify-between mt-4">
                  <p className="text-xs text-charcoal/30 font-body">Your journal is private and saved locally</p>
                  <Link href="/journal" className="text-xs text-gold hover:text-gold-dark font-body font-medium transition-colors">
                    Open full journal →
                  </Link>
                </div>
              </div>
            )}

            {/* Day navigation */}
            <div className="flex items-center justify-between mt-8 pt-6 border-t border-navy/8">
              <button onClick={() => setOffset(o => o - 1)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-full border border-navy/12 text-navy/60 hover:text-navy hover:border-navy/25 text-sm font-body font-medium transition-all">
                <ChevronLeft className="w-4 h-4" /> Previous Day
              </button>
              <div className="text-center">
                <p className="text-xs text-charcoal/35 font-body">
                  {offset === 0 ? 'Today' : offset < 0 ? `${Math.abs(offset)} day${Math.abs(offset) > 1 ? 's' : ''} ago` : `${offset} day${offset > 1 ? 's' : ''} ahead`}
                </p>
              </div>
              <button onClick={() => setOffset(o => o + 1)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-full border border-navy/12 text-navy/60 hover:text-navy hover:border-navy/25 text-sm font-body font-medium transition-all">
                Next Day <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </main>
      <Footer />

      {toast && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 px-5 py-2.5 bg-navy text-white text-sm font-body font-medium rounded-full shadow-xl animate-fade-in" role="status">
          {toast}
        </div>
      )}
    </>
  )
}
