'use client'
import { useState } from 'react'
import { X, ChevronDown, ChevronRight } from 'lucide-react'
import type { Book } from '@/modules/bible/types'
import { OT_GROUPS, NT_GROUPS } from '@/modules/bible/types'

type Props = {
  books:          Book[]
  currentBookId:  string
  onSelect:       (book: Book) => void
  onClose:        () => void
}

export default function BookSelector({ books, currentBookId, onSelect, onClose }: Props) {
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    Gospels: true, // Default open for first-time users
  })
  const [testament, setTestament] = useState<'OT' | 'NT'>('NT')

  const activeGroups = testament === 'OT' ? OT_GROUPS : NT_GROUPS

  const groupedBooks = activeGroups.reduce<Record<string, Book[]>>((acc, group) => {
    const groupBooks = books.filter(b => b.group === group && b.testament === testament)
    if (groupBooks.length) acc[group] = groupBooks
    return acc
  }, {})

  const toggleGroup = (group: string) =>
    setOpenGroups(g => ({ ...g, [group]: !g[group] }))

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-navy/10">
        <h2 className="font-display text-lg font-semibold text-navy">Choose a Book</h2>
        <button
          onClick={onClose}
          className="p-2 rounded-lg text-charcoal/40 hover:text-navy hover:bg-navy/5 transition-colors"
          aria-label="Close book selector"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Testament toggle */}
      <div className="flex p-3 gap-2 border-b border-navy/8">
        {(['OT', 'NT'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTestament(t)}
            className={`flex-1 py-2 rounded-lg text-sm font-body font-medium transition-all ${
              testament === t
                ? 'bg-navy text-white'
                : 'text-charcoal/50 hover:bg-navy/5 hover:text-navy'
            }`}
          >
            {t === 'OT' ? 'Old Testament' : 'New Testament'}
          </button>
        ))}
      </div>

      {/* Book groups — scrollable */}
      <div className="flex-1 overflow-y-auto">
        {Object.entries(groupedBooks).map(([group, groupBooks]) => (
          <div key={group}>
            <button
              onClick={() => toggleGroup(group)}
              className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-navy/3 transition-colors"
            >
              <span className="text-xs font-body font-semibold text-navy/40 tracking-widest uppercase">
                {group}
              </span>
              {openGroups[group]
                ? <ChevronDown className="w-3.5 h-3.5 text-navy/30" />
                : <ChevronRight className="w-3.5 h-3.5 text-navy/30" />
              }
            </button>

            {openGroups[group] && (
              <div className="grid grid-cols-2 gap-1 px-3 pb-3">
                {groupBooks.map(book => (
                  <button
                    key={book.bookId}
                    onClick={() => onSelect(book)}
                    className={`
                      px-3 py-2.5 rounded-lg text-left transition-all duration-150
                      ${book.bookId === currentBookId
                        ? 'bg-navy text-white'
                        : 'hover:bg-navy/8 text-charcoal/70 hover:text-navy'
                      }
                    `}
                  >
                    <span className="block text-sm font-body font-medium truncate">{book.name}</span>
                    <span className={`text-xs ${book.bookId === currentBookId ? 'text-white/60' : 'text-charcoal/35'}`}>
                      {book.chapterCount} ch.
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}