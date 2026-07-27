import { NextRequest } from 'next/server'
import { successResponse, serverErrorResponse } from '@/lib/api-response'
import { prisma } from '@/lib/db/client'
import { getChapter } from '@/modules/bible/services/bible-api'
import { BOOKS } from '@/modules/bible/services/mock-data'

// GET /api/v1/daily
// Previously served one of only 5 hardcoded entries on a day-of-year
// rotation -- genuinely repeated every 5 days, not truly daily. This now
// generates real content once per calendar date via Claude, caches it in
// DailyGenerated, and serves the cached row to every visitor that same
// day. Deliberately does NOT let the AI generate the verse text itself --
// the AI companion's own system prompt forbids fabricating Scripture, so
// this asks Claude only for a reference plus reflection/prayer/challenge,
// then fetches the real verse text from our actual Bible API (BSB) to
// guarantee accuracy.

function todayKey(): string {
  return new Date().toISOString().slice(0, 10)
}

async function generateTodayEntry() {
  const anthropicKey = process.env.ANTHROPIC_API_KEY
  const date = todayKey()

  const FALLBACK_REFS = ['PSA.46.1', 'ISA.41.10', 'PHP.4.6', 'JHN.14.27', 'ROM.8.28', 'MAT.11.28', 'JOS.1.9']
  const pickFallbackRef = () => FALLBACK_REFS[new Date(date).getUTCDate() % FALLBACK_REFS.length]

  let bookId = 'PSA', chapter = 46, verse = 1
  let title = 'God is Our Refuge', reflection = '', prayer = '', challenge = '', reflectionQuestion = ''

  if (anthropicKey) {
    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': anthropicKey, 'anthropic-version': '2023-06-01' },
        body: JSON.stringify({
          model: 'claude-sonnet-5',
          max_tokens: 800,
          system: 'You are generating a daily devotional for a Christian app. Respond with ONLY valid JSON, no other text, matching exactly: {"book_id": "3-letter USFM code e.g. PSA, JHN, ROM", "chapter": number, "verse": number, "title": "short devotional title", "reflection": "150-250 word reflection connecting to the verse", "prayer": "80-120 word guided prayer", "challenge": "one short practical action for today", "reflection_question": "one short reflective question"}. Pick a different, meaningful verse each time -- do not always pick the most famous ones. Never invent a reference that does not exist.',
          messages: [{ role: 'user', content: `Generate today's devotional for ${date}.` }],
        }),
      })
      if (res.ok) {
        const data = await res.json()
        const text = data.content?.[0]?.text ?? ''
        const parsed = JSON.parse(text.trim())
        const validBook = BOOKS.find(b => b.bookId === parsed.book_id)
        if (validBook && Number(parsed.chapter) > 0 && Number(parsed.chapter) <= validBook.chapterCount) {
          bookId = parsed.book_id
          chapter = Number(parsed.chapter)
          verse = Number(parsed.verse) || 1
          title = String(parsed.title ?? title).slice(0, 255)
          reflection = String(parsed.reflection ?? '')
          prayer = String(parsed.prayer ?? '')
          challenge = String(parsed.challenge ?? '')
          reflectionQuestion = String(parsed.reflection_question ?? '')
        }
      }
    } catch (e) {
      console.error('[Daily] AI generation failed, using fallback:', e)
    }
  }

  if (!reflection) {
    const ref = pickFallbackRef()
    const [b, c, v] = ref.split('.')
    bookId = b; chapter = Number(c); verse = Number(v)
    title = 'A Word for Today'
    reflection = 'Whatever today holds, God\'s Word meets you exactly where you are. Take a moment to sit with this verse before you move into the rest of your day.'
    prayer = 'Lord, thank You for meeting me here today. Help me carry this truth with me. Amen.'
    challenge = 'Return to this verse once more before the day ends.'
    reflectionQuestion = 'What does this verse reveal about God\'s character?'
  }

  const chapterData = await getChapter('BSB', bookId, chapter)
  const verseData = chapterData?.verses.find(v => v.verseNumber === verse) ?? chapterData?.verses[0]
  const bookName = BOOKS.find(b => b.bookId === bookId)?.name ?? bookId

  const entry = {
    date,
    verse_reference: verseData?.reference ?? `${bookName} ${chapter}:${verse}`,
    verse_text: verseData?.text ?? 'Scripture text unavailable today -- please read this passage directly in the Bible reader.',
    translation: 'BSB',
    title, reflection, prayer, challenge,
    reflection_question: reflectionQuestion,
  }

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (prisma as any).dailyGenerated.create({ data: entry })
  } catch (e) {
    console.error('[Daily] Failed to cache generated entry:', e)
  }

  return entry
}

export async function GET(req: NextRequest) {
  try {
    const offsetParam = req.nextUrl.searchParams.get('offset')
    const offset = offsetParam ? parseInt(offsetParam) : 0
    const targetDate = new Date(Date.now() + offset * 86400000).toISOString().slice(0, 10)

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = prisma as any
    const existing = await db.dailyGenerated.findUnique({ where: { date: targetDate } })
    if (existing) return successResponse(existing, 'Daily encouragement retrieved.')

    if (targetDate !== todayKey()) {
      const today = await db.dailyGenerated.findUnique({ where: { date: todayKey() } })
      if (today) return successResponse(today, 'Daily encouragement retrieved.')
    }

    const entry = await generateTodayEntry()
    return successResponse(entry, 'Daily encouragement retrieved.')
  } catch (error) {
    console.error('[Daily] Error:', error)
    return serverErrorResponse()
  }
}
