'use client'
import { useState } from 'react'
import { X, Sparkles, ChevronDown, ChevronUp, BookOpen, ExternalLink } from 'lucide-react'
import type { CommentaryNote, CommentaryType } from '../types'

type Props = {
  reference:   string
  verseText:   string
  notes:       CommentaryNote[]
  loading:     boolean
  onClose:     () => void
  onAIStudy?:  (reference: string, note: CommentaryNote) => void
  className?:  string
}

const TYPE_CONFIG: Record<CommentaryType, { label: string; icon: string; accent: string }> = {
  verse:          { label: 'Commentary',          icon: '📖', accent: 'bg-navy/4 border-navy/10'     },
  passage:        { label: 'Passage Notes',       icon: '📜', accent: 'bg-navy/4 border-navy/10'     },
  historical:     { label: 'Historical Context',  icon: '🏛️', accent: 'bg-amber-50 border-amber-100' },
  cultural:       { label: 'Cultural Background', icon: '🌍', accent: 'bg-green-50 border-green-100' },
  word_study:     { label: 'Word Study',          icon: '🔤', accent: 'bg-blue-50 border-blue-100'   },
  application:    { label: 'Application',         icon: '💡', accent: 'bg-gold/8 border-gold/15'     },
  cross_reference:{ label: 'Cross References',    icon: '🔗', accent: 'bg-purple-50 border-purple-100'},
  topic:          { label: 'Topic Connection',    icon: '🧵', accent: 'bg-sage/10 border-sage/20'    },
}

function NoteCard({ note, onAIStudy, reference }: {
  note:       CommentaryNote
  onAIStudy?: (ref: string, note: CommentaryNote) => void
  reference:  string
}) {
  const [expanded, setExpanded] = useState(true)
  const [aiOpen,   setAiOpen]   = useState(false)
  const cfg = TYPE_CONFIG[note.type] ?? TYPE_CONFIG.verse

  // Parse basic markdown in content (bold with **)
  const renderContent = (text: string) =>
    text.split(/\*\*(.*?)\*\*/g).map((part, i) =>
      i % 2 === 1
        ? <strong key={i} className="font-semibold text-navy">{part}</strong>
        : <span key={i}>{part}</span>
    )

  return (
    <div className={`rounded-xl border overflow-hidden mb-3 ${cfg.accent}`}>
      {/* Header */}
      <button
        onClick={() => setExpanded(e => !e)}
        className="w-full flex items-center justify-between px-4 py-3 text-left"
      >
        <div className="flex items-center gap-2">
          <span className="text-sm">{cfg.icon}</span>
          <span className="text-xs font-body font-semibold text-navy/60 tracking-wider uppercase">{cfg.label}</span>
        </div>
        {expanded
          ? <ChevronUp className="w-3.5 h-3.5 text-charcoal/30" />
          : <ChevronDown className="w-3.5 h-3.5 text-charcoal/30" />
        }
      </button>

      {/* Content */}
      {expanded && (
        <div className="px-4 pb-4">
          <p className="text-sm font-body text-charcoal/70 leading-relaxed">
            {renderContent(note.content)}
          </p>

          {/* AI Explain Further button */}
          {onAIStudy && (
            <button
              onClick={() => { onAIStudy(reference, note); setAiOpen(true) }}
              className="mt-3 inline-flex items-center gap-1.5 text-xs font-body font-medium text-gold hover:text-gold-dark transition-colors"
            >
              <Sparkles className="w-3 h-3" />
              Explain Further with AI
            </button>
          )}
        </div>
      )}
    </div>
  )
}

// ─── POPUP MODE COMPONENT ────────────────────────────────────────────────────
export function CommentaryPopup({ reference, verseText, notes, loading, onClose, onAIStudy }: Props) {
  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-navy/20 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel — bottom sheet on mobile, side panel on desktop */}
      <div
        className="fixed bottom-0 left-0 right-0 sm:bottom-auto sm:top-16 sm:right-0 sm:left-auto sm:w-96 sm:h-[calc(100vh-4rem)] z-50 bg-white rounded-t-3xl sm:rounded-none sm:rounded-bl-2xl shadow-2xl shadow-navy/25 flex flex-col max-h-[80vh] sm:max-h-none"
        role="dialog"
        aria-modal="true"
        aria-label={`Study notes for ${reference}`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-navy/8 shrink-0">
          <div>
            <h2 className="font-body text-sm font-semibold text-navy">Study Notes</h2>
            <p className="text-xs text-gold font-body font-semibold mt-0.5">{reference}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-charcoal/35 hover:text-navy hover:bg-navy/5 transition-colors"
            aria-label="Close study notes"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Verse text */}
        <div className="px-5 py-4 bg-cream/60 border-b border-navy/6 shrink-0">
          <p className="font-display italic text-navy text-sm leading-relaxed">
            &ldquo;{verseText}&rdquo;
          </p>
        </div>

        {/* Notes */}
        <div className="flex-1 overflow-y-auto p-5">
          {loading && (
            <div className="space-y-3 animate-pulse">
              {[1,2].map(i => (
                <div key={i} className="rounded-xl border border-navy/8 p-4">
                  <div className="h-3 w-24 bg-navy/10 rounded mb-3" />
                  <div className="space-y-2">
                    <div className="h-3 w-full bg-navy/6 rounded" />
                    <div className="h-3 w-4/5 bg-navy/5 rounded" />
                    <div className="h-3 w-3/5 bg-navy/4 rounded" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {!loading && notes.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <BookOpen className="w-10 h-10 text-navy/15 mb-3" />
              <p className="text-sm font-body text-charcoal/40 mb-1">No study notes yet</p>
              <p className="text-xs font-body text-charcoal/30">
                More commentary coming soon
              </p>
            </div>
          )}

          {!loading && notes.map(note => (
            <NoteCard
              key={note.id}
              note={note}
              reference={reference}
              onAIStudy={onAIStudy}
            />
          ))}

          {!loading && notes.length > 0 && (
            <p className="text-xs text-charcoal/25 font-body text-center mt-2 italic">
              Kingdom Companion Study Notes · Public domain & original content
            </p>
          )}
        </div>
      </div>
    </>
  )
}

// ─── INLINE MODE COMPONENT ────────────────────────────────────────────────────
export function InlineCommentary({ reference, notes, loading, onAIStudy }: Omit<Props, 'verseText' | 'onClose'>) {
  const [collapsed, setCollapsed] = useState(false)

  if (loading || notes.length === 0) return null

  return (
    <div className="ml-8 mr-2 mt-1 mb-3" aria-label={`Study notes for ${reference}`}>
      {/* Toggle header */}
      <button
        onClick={() => setCollapsed(c => !c)}
        className="flex items-center gap-2 mb-2 group"
        aria-expanded={!collapsed}
      >
        <div className="h-px flex-1 bg-gold/20" />
        <span className="text-xs font-body font-medium text-gold/60 group-hover:text-gold transition-colors whitespace-nowrap">
          {collapsed ? '▸ Study Notes' : '▾ Study Notes'}
        </span>
        <div className="h-px flex-1 bg-gold/20" />
      </button>

      {!collapsed && (
        <div className="space-y-2.5 pl-0">
          {notes.map(note => (
            <NoteCard
              key={note.id}
              note={note}
              reference={reference}
              onAIStudy={onAIStudy}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// ─── VERSE NOTE INDICATOR (for popup mode) ───────────────────────────────────
export function NoteIndicator({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={e => { e.stopPropagation(); onClick() }}
      className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-gold/20 hover:bg-gold/35 text-gold border border-gold/30 text-[9px] font-bold transition-all ml-1 align-middle hover:scale-110"
      aria-label="View study notes"
      title="Study notes available"
    >
      ✦
    </button>
  )
}