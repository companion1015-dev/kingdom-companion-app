// ─── COMMENTARY TYPES ────────────────────────────────────────────────────────
// Document 23: Bible Study Notes & Commentary Display Requirements
// Provider-based architecture — no hardcoded source
// Supports both Classic (popup) and Inline display modes

// ─── PRISMA SCHEMA ADDITIONS ─────────────────────────────────────────────────
// Add to prisma/schema.prisma:
//
// model CommentaryNote {
//   id               String   @id @default(uuid()) @db.Uuid
//   provider_id      String   @db.VarChar(50)   // e.g. "internal", "public_domain"
//   translation_code String   @db.VarChar(20)
//   book_id          String   @db.VarChar(20)
//   chapter          Int
//   verse_start      Int
//   verse_end        Int?                        // for passage commentary
//   type             String   @db.VarChar(30)   // verse|passage|historical|cultural|word_study|application
//   content          String                      // the commentary text
//   language         String   @default("en") @db.VarChar(10)
//   is_published     Boolean  @default(true)
//   created_at       DateTime @default(now()) @db.Timestamptz
//   updated_at       DateTime @updatedAt @db.Timestamptz
//   @@index([book_id, chapter, verse_start])
//   @@index([provider_id])
//   @@index([translation_code])
//   @@map("commentary_note")
// }
//
// model UserStudySetting {
//   id           String   @id @default(uuid()) @db.Uuid
//   user_id      String   @unique @db.Uuid
//   notes_mode   String   @default("popup") @db.VarChar(20) // none|popup|inline
//   font_size    Int      @default(18)
//   updated_at   DateTime @updatedAt @db.Timestamptz
//   @@map("user_study_setting")
// }

// ─── DISPLAY MODES ───────────────────────────────────────────────────────────

export type NotesDisplayMode = 'none' | 'popup' | 'inline'

export const NOTES_MODE_CONFIG: Record<NotesDisplayMode, {
  label:       string
  description: string
  icon:        string
}> = {
  none:   { label: 'No Study Notes',      description: 'Scripture only — clean reading experience',        icon: '📖' },
  popup:  { label: 'Classic Pop-up Notes',description: 'Notes appear in a pop-up when you tap the icon',  icon: '💬' },
  inline: { label: 'Inline Commentary',   description: 'Explanatory text displayed beneath each verse',   icon: '📝' },
}

// ─── COMMENTARY TYPES ────────────────────────────────────────────────────────

export type CommentaryType =
  | 'verse'           // Single verse explanation
  | 'passage'         // Multi-verse passage commentary
  | 'historical'      // Historical background
  | 'cultural'        // Cultural context
  | 'word_study'      // Hebrew/Greek word meanings
  | 'application'     // Practical application
  | 'cross_reference' // Related Scripture passages
  | 'topic'           // Thematic connection

export type CommentaryNote = {
  id:           string
  provider_id:  string
  book_id:      string
  chapter:      number
  verse_start:  number
  verse_end:    number | null
  type:         CommentaryType
  content:      string
  language:     string
}

// Aggregated notes for a single verse
export type VerseCommentary = {
  verse_id:    string    // e.g. "JHN.3.16"
  reference:   string    // e.g. "John 3:16"
  notes:       CommentaryNote[]
  has_content: boolean
}

// Chapter-level commentary index — loaded once per chapter
export type ChapterCommentaryIndex = {
  book_id:     string
  chapter:     number
  translation: string
  provider:    string
  // Map of verse number → whether commentary exists (for indicator dots)
  has_notes:   Record<number, boolean>
  // Full notes loaded lazily when verse is opened
  notes?:      Record<number, CommentaryNote[]>
}

// ─── PROVIDER ABSTRACTION ────────────────────────────────────────────────────

export interface CommentaryProvider {
  id:           string
  name:         string
  description:  string
  isAvailable:  () => boolean
  getChapterIndex: (bookId: string, chapter: number, translation: string) => Promise<ChapterCommentaryIndex>
  getVerseNotes:   (bookId: string, chapter: number, verse: number, translation: string) => Promise<CommentaryNote[]>
}

// ─── SETTINGS ────────────────────────────────────────────────────────────────

const STUDY_SETTINGS_KEY = 'bc_study_settings'

export type StudySettings = {
  notes_mode:      NotesDisplayMode
  font_size:       number
  show_ai_button:  boolean
}

export const DEFAULT_STUDY_SETTINGS: StudySettings = {
  notes_mode:     'popup',
  font_size:       18,
  show_ai_button:  true,
}

export function loadStudySettings(): StudySettings {
  if (typeof localStorage === 'undefined') return DEFAULT_STUDY_SETTINGS
  try {
    const raw = localStorage.getItem(STUDY_SETTINGS_KEY)
    return raw ? { ...DEFAULT_STUDY_SETTINGS, ...JSON.parse(raw) } : DEFAULT_STUDY_SETTINGS
  } catch { return DEFAULT_STUDY_SETTINGS }
}

export function saveStudySettings(settings: Partial<StudySettings>): void {
  if (typeof localStorage === 'undefined') return
  try {
    const current = loadStudySettings()
    localStorage.setItem(STUDY_SETTINGS_KEY, JSON.stringify({ ...current, ...settings }))
  } catch { /* ignore */ }
}