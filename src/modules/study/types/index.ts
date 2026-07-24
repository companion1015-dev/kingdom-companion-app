// ─── STUDY MODULE TYPES ───────────────────────────────────────────────────────
// ASD Chapter 5 API contracts | DSD Chapter 2 (Note, Highlight, Bookmark tables)
// All field names mirror the database schema exactly

export type HighlightColor = 'yellow' | 'green' | 'blue' | 'pink' | 'orange'

export const HIGHLIGHT_COLORS: Record<HighlightColor, { label: string; bg: string; ring: string; text: string }> = {
  yellow: { label: 'Yellow', bg: 'bg-yellow-200/80',  ring: 'ring-yellow-400', text: '#a16207' },
  green:  { label: 'Green',  bg: 'bg-green-200/80',   ring: 'ring-green-400',  text: '#166534' },
  blue:   { label: 'Blue',   bg: 'bg-blue-200/80',    ring: 'ring-blue-400',   text: '#1e40af' },
  pink:   { label: 'Pink',   bg: 'bg-pink-200/80',    ring: 'ring-pink-400',   text: '#9d174d' },
  orange: { label: 'Orange', bg: 'bg-orange-200/80',  ring: 'ring-orange-400', text: '#9a3412' },
}

export type Highlight = {
  id:              string
  user_id:         string
  translation_id:  string
  book_id:         string
  chapter:         number
  verse_id:        string
  verse_reference: string
  color:           HighlightColor
  created_at:      string
  updated_at:      string
}

export type Note = {
  id:              string
  user_id:         string
  translation_id:  string
  book_id:         string
  chapter:         number
  verse_id:        string
  verse_reference: string
  content:         string
  tags:            string[]
  created_at:      string
  updated_at:      string
}

export type Bookmark = {
  id:              string
  user_id:         string
  translation_id:  string
  book_id:         string
  chapter:         number
  verse_id:        string
  verse_reference: string
  collection_name: string | null
  tags:            string[]
  created_at:      string
}

// Grouped study data for a single verse
export type VerseStudyData = {
  highlight: Highlight | null
  note:      Note | null
  bookmarked: boolean
}

// Client-side study state (in-memory + localStorage before auth)
export type LocalStudyState = {
  highlights: Record<string, { color: HighlightColor; reference: string }>
  bookmarks:  Record<string, { reference: string; collection?: string }>
  notes:      Record<string, { content: string; reference: string; tags: string[] }>
}

export const EMPTY_STUDY_STATE: LocalStudyState = {
  highlights: {},
  bookmarks:  {},
  notes:      {},
}

// Storage key for local persistence
export const STUDY_STORAGE_KEY = 'bc_study_data'