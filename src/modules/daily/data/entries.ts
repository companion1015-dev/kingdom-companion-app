// ─── DAILY ENCOURAGEMENT DATA ────────────────────────────────────────────────
// PRD §4.43: Each daily entry includes Scripture, reflection, prayer, challenge,
// reflection question, suggested reading, and estimated reading time.
// Content is managed via CMS in production — this seeds initial 30 days.

export type DailyEntry = {
  id: string
  date: string
  verse_reference: string
  verse_text: string
  translation: string
  book_id: string
  chapter: number
  title: string
  reflection: string
  prayer: string
  challenge: string
  reflection_question: string
  created_at: string
}

