'use client'
import { X } from 'lucide-react'
import type { Book } from '@/modules/bible/types'

type Props = {
  book:           Book
  currentChapter: number
  onSelect:       (chapter: number) => void
  onClose:        () => void
}

export default function ChapterSelector({ book, currentChapter, onSelect, onClose }: Props) {
  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-navy/10">
        <div>
          <h2 className="font-display text-lg font-semibold text-navy">{book.name}</h2>
          <p className="text-xs text-charcoal/40 font-body">{book.chapterCount} chapters</p>
        </div>
        <button
          onClick={onClose}
          className="p-2 rounded-lg text-charcoal/40 hover:text-navy hover:bg-navy/5 transition-colors"
          aria-label="Close chapter selector"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Chapter grid */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="grid grid-cols-5 sm:grid-cols-6 gap-2">
          {Array.from({ length: book.chapterCount }, (_, i) => i + 1).map(ch => (
            <button
              key={ch}
              onClick={() => onSelect(ch)}
              className={`
                aspect-square rounded-xl flex items-center justify-center font-body text-sm font-medium
                transition-all duration-150 hover:scale-105
                ${ch === currentChapter
                  ? 'bg-navy text-white shadow-md shadow-navy/20'
                  : 'bg-navy/6 text-navy/60 hover:bg-navy/15 hover:text-navy'
                }
              `}
              aria-label={`Chapter ${ch}`}
              aria-pressed={ch === currentChapter}
            >
              {ch}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}