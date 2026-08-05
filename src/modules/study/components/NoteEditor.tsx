'use client'
import { useState, useEffect, useRef } from 'react'
import { X, Save, Trash2, Tag, Plus } from 'lucide-react'

type Props = {
  verseReference: string
  verseText:      string
  initialContent: string
  initialTags:    string[]
  onSave:    (content: string, tags: string[]) => void
  onDelete:  () => void
  onClose:   () => void
}

export default function NoteEditor({
  verseReference, verseText, initialContent, initialTags,
  onSave, onDelete, onClose,
}: Props) {
  const [content,  setContent]  = useState(initialContent)
  const [tags,     setTags]     = useState<string[]>(initialTags)
  const [tagInput, setTagInput] = useState('')
  const [dirty,    setDirty]    = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const isEditing = !!initialContent

  useEffect(() => {
    textareaRef.current?.focus()
    // Auto-resize textarea
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`
    }
  }, [])

  const handleContentChange = (val: string) => {
    setContent(val)
    setDirty(true)
    // Auto-resize
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`
    }
  }

  const addTag = () => {
    const tag = tagInput.trim().toLowerCase().replace(/\s+/g, '-')
    if (tag && !tags.includes(tag) && tags.length < 10) {
      setTags(t => [...t, tag])
      setTagInput('')
      setDirty(true)
    }
  }

  const removeTag = (tag: string) => {
    setTags(t => t.filter(x => x !== tag))
    setDirty(true)
  }

  const handleSave = () => {
    if (!content.trim()) return
    onSave(content.trim(), tags)
    onClose()
  }

  const handleDelete = () => {
    if (confirm('Delete this note?')) {
      onDelete()
      onClose()
    }
  }

  // Trap focus inside modal
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (dirty && content.trim()) {
          if (confirm('Discard unsaved changes?')) onClose()
        } else {
          onClose()
        }
      }
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [dirty, content, onClose])

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-navy/30 backdrop-blur-sm"
        onClick={() => {
          if (dirty && content.trim()) {
            if (confirm('Discard unsaved changes?')) onClose()
          } else {
            onClose()
          }
        }}
        aria-hidden="true"
      />

      {/* Modal */}
      <div
        className="fixed inset-x-4 bottom-0 sm:inset-auto sm:left-1/2 sm:-translate-x-1/2 sm:top-1/2 sm:-translate-y-1/2 sm:w-full sm:max-w-lg z-50 bg-white dark:bg-navy-dark rounded-t-2xl sm:rounded-2xl shadow-2xl shadow-navy/30 flex flex-col max-h-[90vh]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="note-editor-title"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-navy/8 shrink-0">
          <div className="flex-1 min-w-0">
            <h2 id="note-editor-title" className="font-body text-sm font-semibold text-navy dark:text-cream truncate">
              {isEditing ? 'Edit note' : 'Add note'}
            </h2>
            <p className="text-xs text-gold font-body font-medium mt-0.5">{verseReference}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-charcoal/40 dark:text-cream/40 hover:text-navy dark:text-cream hover:bg-navy/5 transition-colors shrink-0"
            aria-label="Close note editor"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Verse reference */}
        <div className="px-5 py-3 bg-cream/70 dark:bg-navy-dark border-b border-navy/6 shrink-0">
          <p className="font-display italic text-sm text-navy/60 dark:text-cream/60 leading-relaxed line-clamp-2">
            &ldquo;{verseText}&rdquo;
          </p>
        </div>

        {/* Note textarea — scrollable */}
        <div className="flex-1 overflow-y-auto p-5">
          <textarea
            ref={textareaRef}
            value={content}
            onChange={e => handleContentChange(e.target.value)}
            placeholder="Write your reflection, insight, or prayer here…"
            className="w-full min-h-[120px] bg-transparent text-navy dark:text-cream font-body text-sm leading-relaxed resize-none outline-none placeholder-charcoal/30"
            style={{ caretColor: '#C9A84C' }}
            maxLength={10000}
          />

          {/* Character count */}
          <div className="flex justify-end mt-1">
            <span className="text-xs text-charcoal/25 dark:text-cream/25 font-body">{content.length}/10,000</span>
          </div>

          {/* Tags section */}
          <div className="mt-4 pt-4 border-t border-navy/6">
            <div className="flex items-center gap-2 mb-3">
              <Tag className="w-3.5 h-3.5 text-charcoal/35 dark:text-cream/35" />
              <span className="text-xs text-charcoal/40 dark:text-cream/40 font-body">Tags</span>
            </div>

            {/* Existing tags */}
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-3">
                {tags.map(tag => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-navy/8 text-navy/60 dark:text-cream/60 text-xs font-body"
                  >
                    #{tag}
                    <button
                      onClick={() => removeTag(tag)}
                      className="text-charcoal/30 dark:text-cream/30 hover:text-red-400 transition-colors"
                      aria-label={`Remove tag ${tag}`}
                    >
                      <X className="w-2.5 h-2.5" />
                    </button>
                  </span>
                ))}
              </div>
            )}

            {/* Add tag input */}
            {tags.length < 10 && (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={tagInput}
                  onChange={e => setTagInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addTag() } }}
                  placeholder="Add a tag…"
                  className="flex-1 px-3 py-1.5 rounded-lg border border-navy/12 text-xs font-body text-navy dark:text-cream placeholder-charcoal/30 outline-none focus:border-gold/40 transition-colors bg-transparent"
                  maxLength={50}
                />
                <button
                  onClick={addTag}
                  disabled={!tagInput.trim()}
                  className="p-1.5 rounded-lg bg-navy/6 text-navy/50 dark:text-cream/50 hover:bg-navy/15 hover:text-navy dark:text-cream disabled:opacity-30 transition-colors"
                  aria-label="Add tag"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Footer actions */}
        <div className="flex items-center gap-3 p-5 border-t border-navy/8 shrink-0">
          {isEditing && (
            <button
              onClick={handleDelete}
              className="p-2.5 rounded-xl text-charcoal/35 dark:text-cream/35 hover:text-red-500 hover:bg-red-50 transition-all"
              aria-label="Delete note"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
          <div className="flex-1" />
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-navy/12 text-charcoal/50 dark:text-cream/50 hover:text-navy dark:text-cream text-sm font-body font-medium transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!content.trim()}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-navy hover:bg-navy-light disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-body font-medium transition-all"
          >
            <Save className="w-3.5 h-3.5" />
            Save note
          </button>
        </div>
      </div>
    </>
  )
}