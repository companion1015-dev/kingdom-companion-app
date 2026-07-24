'use client'
import { useEffect, useRef } from 'react'
import { Highlighter, Bookmark, FileText, Copy, Share2, Sparkles, X } from 'lucide-react'
import type { Verse } from '@/modules/bible/types'

type Props = {
  verse:       Verse
  position:    { x: number; y: number }
  noteContent?: string   // existing note content if any
  onClose:     () => void
  onHighlight: (verse: Verse, color: string) => void
  onBookmark:  (verse: Verse) => void
  onNote:      (verse: Verse) => void
  onCopy:      (verse: Verse) => void
  onAIStudy:   (verse: Verse) => void
}

const HIGHLIGHT_COLORS = [
  { id: 'yellow', bg: 'bg-yellow-300', label: 'Yellow' },
  { id: 'green',  bg: 'bg-green-300',  label: 'Green'  },
  { id: 'blue',   bg: 'bg-blue-300',   label: 'Blue'   },
  { id: 'pink',   bg: 'bg-pink-300',   label: 'Pink'   },
  { id: 'orange', bg: 'bg-orange-300', label: 'Orange' },
]

export default function VerseContextMenu({
  verse, position, noteContent, onClose, onHighlight, onBookmark, onNote, onCopy, onAIStudy,
}: Props) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose()
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [onClose])

  // Adjust position so menu stays on screen
  const left = Math.min(position.x, (typeof window !== 'undefined' ? window.innerWidth : 800) - 240)
  const top  = position.y + 8

  const hasNote = !!noteContent

  const actions = [
    { icon: Bookmark, label: 'Bookmark',            action: () => { onBookmark(verse); onClose() } },
    { icon: FileText, label: hasNote ? 'Edit note' : 'Add note', action: () => { onNote(verse); onClose() } },
    { icon: Copy,     label: 'Copy verse',           action: () => { onCopy(verse); onClose() } },
    { icon: Share2,   label: 'Share',                action: () => { onCopy(verse); onClose() } },
    { icon: Sparkles, label: 'AI Bible Study',       action: () => { onAIStudy(verse); onClose() }, gold: true },
  ]

  return (
    <div
      ref={ref}
      className="fixed z-50 w-56 bg-white rounded-2xl shadow-2xl shadow-navy/20 border border-navy/8 overflow-hidden"
      style={{ left, top }}
      role="menu"
      aria-label={`Actions for ${verse.reference}`}
    >
      {/* Reference header */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-navy/4 border-b border-navy/8">
        <span className="text-xs font-body font-semibold text-navy/60">{verse.reference}</span>
        <button onClick={onClose} className="text-charcoal/30 hover:text-navy transition-colors" aria-label="Close">
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Existing note preview — OLD FORMAT: shown inline in popup */}
      {hasNote && (
        <div className="px-4 py-2.5 bg-gold/8 border-b border-gold/15">
          <p className="text-xs text-charcoal/50 font-body font-medium mb-0.5">Your note:</p>
          <p className="text-xs text-navy/70 font-body leading-relaxed line-clamp-2">{noteContent}</p>
        </div>
      )}

      {/* Highlight colours */}
      <div className="px-4 py-2.5 border-b border-navy/8">
        <div className="flex items-center gap-2 mb-2">
          <Highlighter className="w-3 h-3 text-charcoal/35" />
          <span className="text-xs text-charcoal/35 font-body">Highlight</span>
        </div>
        <div className="flex gap-2">
          {HIGHLIGHT_COLORS.map(color => (
            <button
              key={color.id}
              onClick={() => { onHighlight(verse, color.id); onClose() }}
              className={`w-6 h-6 rounded-full ${color.bg} hover:scale-110 transition-transform shadow-sm ring-2 ring-transparent hover:ring-navy/20`}
              aria-label={`Highlight ${color.label}`}
            />
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="py-1">
        {actions.map(({ icon: Icon, label, action, gold }) => (
          <button
            key={label}
            onClick={action}
            role="menuitem"
            className={`w-full flex items-center gap-3 px-4 py-2 text-left transition-colors ${
              gold
                ? 'text-gold hover:bg-gold/6'
                : 'text-charcoal/65 hover:bg-navy/4 hover:text-navy'
            }`}
          >
            <Icon className="w-3.5 h-3.5 shrink-0" />
            <span className="text-xs font-body">{label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}