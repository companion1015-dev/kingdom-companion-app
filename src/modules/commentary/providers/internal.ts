// ─── INTERNAL COMMENTARY PROVIDER ────────────────────────────────────────────
// Public-domain and internally authored commentary
// Architecture: implements CommentaryProvider interface
// Additional licensed providers (e.g. Tyndale, Logos) plug in via same interface

import type { CommentaryProvider, CommentaryNote, ChapterCommentaryIndex } from '../types'

// ─── SEED COMMENTARY DATA ─────────────────────────────────────────────────────
// Covers key verses across Genesis, Psalms, John, Romans, Philippians
// CMS admin can add more via the commentary_note table

const COMMENTARY_DB: Record<string, CommentaryNote[]> = {
  // John 3
  'JHN.3.16': [
    {
      id: 'c-jhn-3-16-1', provider_id: 'internal', book_id: 'JHN',
      chapter: 3, verse_start: 16, verse_end: null,
      type: 'verse', language: 'en',
      content: 'Often called "the Gospel in miniature," this verse summarises the entire message of Christianity. "God so loved" — not merely that God loved, but the measure and manner of that love. The word "so" (Greek: houtos) means "in this way," pointing to what follows. God\'s love was demonstrated through the costly gift of His Son.',
    },
    {
      id: 'c-jhn-3-16-2', provider_id: 'internal', book_id: 'JHN',
      chapter: 3, verse_start: 16, verse_end: null,
      type: 'word_study', language: 'en',
      content: '**κόσμον (kosmos) — "the world":** John uses this word to mean humanity in its rebellion against God — not the physical earth, but people in their fallenness. The remarkable truth is that God loved the world not when it was lovely or deserving, but precisely in its brokenness.',
    },
    {
      id: 'c-jhn-3-16-3', provider_id: 'internal', book_id: 'JHN',
      chapter: 3, verse_start: 16, verse_end: null,
      type: 'cross_reference', language: 'en',
      content: '**Related passages:** Romans 5:8 — "while we were still sinners, Christ died for us." 1 John 4:9-10 — "This is how God showed his love among us." Ephesians 2:4-5 — "because of his great love for us, God... made us alive with Christ."',
    },
  ],
  'JHN.3.3': [
    {
      id: 'c-jhn-3-3-1', provider_id: 'internal', book_id: 'JHN',
      chapter: 3, verse_start: 3, verse_end: null,
      type: 'verse', language: 'en',
      content: '"Born again" (Greek: γεννηθῇ ἄνωθεν — gennethe anothen) carries a deliberate double meaning: it can mean "born again" or "born from above." Nicodemus understood the physical meaning; Jesus intended the spiritual one. This conversation reveals that entry into God\'s kingdom is not achieved through human effort or heritage — it requires a supernatural work of the Spirit.',
    },
  ],
  // Psalm 23
  'PSA.23.1': [
    {
      id: 'c-psa-23-1-1', provider_id: 'internal', book_id: 'PSA',
      chapter: 23, verse_start: 1, verse_end: null,
      type: 'historical', language: 'en',
      content: 'David wrote this psalm from experience — he was himself a shepherd before becoming king (1 Samuel 16:11). He understood the relationship between shepherd and sheep from both sides. The declaration "The Lord is my shepherd" is intensely personal — not "a shepherd" or "our shepherd" but "my shepherd." This is intimate trust, not abstract theology.',
    },
    {
      id: 'c-psa-23-1-2', provider_id: 'internal', book_id: 'PSA',
      chapter: 23, verse_start: 1, verse_end: null,
      type: 'word_study', language: 'en',
      content: '**יְהוָה רֹעִי (Yahweh ro\'i) — "The LORD is my shepherd":** Ro\'i comes from the Hebrew root ra\'ah, meaning to tend, pasture, or shepherd. The use of the divine name Yahweh (the self-existent, covenant God) alongside this tender image creates a powerful combination: the eternal God of the universe is personally tending to you.',
    },
  ],
  'PSA.23.4': [
    {
      id: 'c-psa-23-4-1', provider_id: 'internal', book_id: 'PSA',
      chapter: 23, verse_start: 4, verse_end: null,
      type: 'verse', language: 'en',
      content: '"The darkest valley" (Hebrew: tsalmaveth) was traditionally translated "the valley of the shadow of death." It refers to the deep ravines in the Judean wilderness where predators hid and where shepherds led their flocks to water. David does not promise the valley will be avoided — he promises that the Shepherd will be present through it. "You are with me" shifts from speaking about God ("He makes me," "He leads me") to speaking to God — a sign of closeness intensifying in difficulty.',
    },
  ],
  // Philippians 4
  'PHP.4.6': [
    {
      id: 'c-php-4-6-1', provider_id: 'internal', book_id: 'PHP',
      chapter: 4, verse_start: 6, verse_end: 7,
      type: 'passage', language: 'en',
      content: 'Paul wrote this from prison — a context that transforms every word. This is not the philosophy of someone who has never suffered; it is hard-won wisdom from a man who had faced beatings, shipwreck, and imprisonment. "In every situation" (Greek: en panti) means without exception — no circumstance is excluded from the scope of prayer.',
    },
    {
      id: 'c-php-4-6-2', provider_id: 'internal', book_id: 'PHP',
      chapter: 4, verse_start: 6, verse_end: null,
      type: 'application', language: 'en',
      content: '**Practical pattern:** (1) Bring the anxiety — specifically, by name. (2) Add thanksgiving — remember God\'s faithfulness in the past. (3) Receive the peace — which "transcends understanding" means it cannot be explained rationally. It simply comes as a gift. The peace "guards" (Greek: phroureo — a military term meaning to stand watch) your heart and mind.',
    },
  ],
  // Romans 8
  'ROM.8.28': [
    {
      id: 'c-rom-8-28-1', provider_id: 'internal', book_id: 'ROM',
      chapter: 8, verse_start: 28, verse_end: null,
      type: 'verse', language: 'en',
      content: 'This verse is often quoted as comfort but rarely read in context. Paul has just spoken about suffering, groaning creation, and the Spirit helping us in our weakness (v.26). The "all things" working together for good does not mean every event is good — it means God weaves even painful threads into something ultimately beautiful for those who love Him and are called according to His purpose.',
    },
  ],
  // Isaiah 40
  'ISA.40.31': [
    {
      id: 'c-isa-40-31-1', provider_id: 'internal', book_id: 'ISA',
      chapter: 40, verse_start: 31, verse_end: null,
      type: 'verse', language: 'en',
      content: 'Isaiah addresses exiles who felt abandoned (40:27 — "My way is hidden from the LORD"). The answer God gives is not a battle plan but a promise of renewed strength for those who wait. The Hebrew word translated "hope" (qavah) literally means to twist or bind together — like strands of rope. Hoping in the LORD means intertwining your life with His.',
    },
    {
      id: 'c-isa-40-31-2', provider_id: 'internal', book_id: 'ISA',
      chapter: 40, verse_start: 31, verse_end: null,
      type: 'cultural', language: 'en',
      content: '**Eagle imagery:** Eagles do not flap furiously to gain altitude — they find thermal currents of warm rising air and spread their wings. The image captures the posture of faith perfectly: not striving in our own strength, but opening ourselves to the wind of God\'s Spirit, which lifts us beyond what human effort can achieve.',
    },
  ],
}

// Build index of which verses have commentary
function buildIndex(bookId: string, chapter: number): Record<number, boolean> {
  const prefix = `${bookId}.${chapter}.`
  const index: Record<number, boolean> = {}
  Object.keys(COMMENTARY_DB).forEach(key => {
    if (key.startsWith(prefix)) {
      const verse = parseInt(key.split('.')[2])
      if (!isNaN(verse)) index[verse] = true
    }
  })
  return index
}

// ─── PROVIDER IMPLEMENTATION ─────────────────────────────────────────────────

export const InternalCommentaryProvider: CommentaryProvider = {
  id:          'internal',
  name:        'Kingdom Companion Study Notes',
  description: 'Curated commentary from public-domain and original sources',

  isAvailable: () => true,  // Always available — built-in

  getChapterIndex: async (bookId, chapter, _translation) => ({
    book_id:     bookId,
    chapter,
    translation: _translation,
    provider:    'internal',
    has_notes:   buildIndex(bookId, chapter),
  }),

  getVerseNotes: async (bookId, chapter, verse, _translation) => {
    const key = `${bookId}.${chapter}.${verse}`
    return COMMENTARY_DB[key] ?? []
  },
}

// ─── PROVIDER REGISTRY ───────────────────────────────────────────────────────
// Additional providers (Tyndale, Logos, ESV Study Bible) plug in here

import type { CommentaryProvider as ICommentaryProvider } from '../types'

const PROVIDERS: Record<string, ICommentaryProvider> = {
  internal: InternalCommentaryProvider,
}

export function getProvider(id: string): ICommentaryProvider | null {
  return PROVIDERS[id] ?? null
}

export function getDefaultProvider(): ICommentaryProvider {
  return InternalCommentaryProvider
}

export function registerProvider(provider: ICommentaryProvider): void {
  PROVIDERS[provider.id] = provider
}