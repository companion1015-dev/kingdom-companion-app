'use client'
import Link from 'next/link'
import { Search, ChevronDown, Settings2, BookOpen, ArrowLeft } from 'lucide-react'
import type { Book, Translation } from '@/modules/bible/types'

type Props = {
  currentBook:     Book | null
  currentChapter:  number
  currentTranslation: string
  translations:    Translation[]
  onBookClick:     () => void
  onChapterClick:  () => void
  onTranslationChange: (code: string) => void
  onSearchClick:   () => void
  fontSize:        number
  onFontSizeChange:(size: number) => void
}

export default function BibleToolbar({
  currentBook, currentChapter, currentTranslation,
  translations, onBookClick, onChapterClick,
  onTranslationChange, onSearchClick, fontSize, onFontSizeChange,
}: Props) {
  return (
    <div className="sticky top-0 z-30 bg-white/95 dark:bg-navy-dark backdrop-blur-md border-b border-navy/8 shadow-sm shadow-navy/4">
      <div className="max-w-3xl mx-auto px-4">
        <div className="flex items-center gap-2 h-14">

          {/* Back to home */}
          <Link
            href="/"
            className="p-2 text-charcoal/40 dark:text-cream/40 hover:text-navy dark:text-cream transition-colors rounded-lg hover:bg-navy/5 shrink-0"
            aria-label="Back to home"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>

          {/* Book + Chapter selector */}
          <div className="flex items-center gap-1 flex-1 min-w-0">
            <button
              onClick={onBookClick}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg hover:bg-navy/8 transition-colors group min-w-0"
              aria-label="Select book"
            >
              <BookOpen className="w-4 h-4 text-navy/40 dark:text-cream/40 shrink-0" />
              <span className="font-display text-base font-semibold text-navy dark:text-cream truncate">
                {currentBook?.name ?? 'Select Book'}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-navy/30 dark:text-cream/30 shrink-0 group-hover:text-navy/60 dark:text-cream/60 transition-colors" />
            </button>

            <button
              onClick={onChapterClick}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg hover:bg-navy/8 transition-colors group shrink-0"
              aria-label="Select chapter"
            >
              <span className="font-body text-sm font-medium text-navy/70 dark:text-cream/70 group-hover:text-navy dark:text-cream">
                {currentChapter}
              </span>
              <ChevronDown className="w-3 h-3 text-navy/30 dark:text-cream/30 group-hover:text-navy/60 dark:text-cream/60 transition-colors" />
            </button>
          </div>

          {/* Translation selector */}
          <div className="relative shrink-0">
            <select
              value={currentTranslation}
              onChange={e => onTranslationChange(e.target.value)}
              className="appearance-none pl-2.5 pr-6 py-1.5 rounded-lg border border-navy/12 bg-navy/4 text-navy/70 dark:text-cream/70 text-xs font-body font-semibold hover:border-navy/25 transition-colors outline-none focus:ring-2 focus:ring-gold/30 cursor-pointer"
              aria-label="Select Bible translation"
            >
              {translations.map(t => (
                <option key={t.code} value={t.code}>{t.code}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-1.5 top-1/2 -translate-y-1/2 w-3 h-3 text-navy/40 dark:text-cream/40 pointer-events-none" />
          </div>

          {/* Font size control */}
          <div className="hidden sm:flex items-center gap-1 shrink-0">
            <button
              onClick={() => onFontSizeChange(Math.max(14, fontSize - 2))}
              className="w-7 h-7 rounded-lg hover:bg-navy/8 flex items-center justify-center text-charcoal/50 dark:text-cream/50 hover:text-navy dark:text-cream transition-colors text-sm font-body"
              aria-label="Decrease font size"
            >
              A
            </button>
            <button
              onClick={() => onFontSizeChange(Math.min(28, fontSize + 2))}
              className="w-8 h-8 rounded-lg hover:bg-navy/8 flex items-center justify-center text-charcoal/60 dark:text-cream/60 hover:text-navy dark:text-cream transition-colors text-base font-body font-medium"
              aria-label="Increase font size"
            >
              A
            </button>
          </div>

          {/* Search */}
          <button
            onClick={onSearchClick}
            className="p-2 text-charcoal/40 dark:text-cream/40 hover:text-navy dark:text-cream transition-colors rounded-lg hover:bg-navy/5 shrink-0"
            aria-label="Search Bible"
          >
            <Search className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}