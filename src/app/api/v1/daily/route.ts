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
//
// "Today" is keyed off the CLIENT's local calendar date (?local_date=
// YYYY-MM-DD, sent by every UI call site), not the server's UTC clock --
// server-UTC rotation meant the verse only changed at UTC midnight, which
// can be many hours after a user's own day has already started. Falls back
// to server-UTC date when the param is absent (direct API calls, curl, etc).

function todayKey(): string {
  return new Date().toISOString().slice(0, 10)
}

function isValidDateKey(s: string | null): s is string {
  return !!s && /^\d{4}-\d{2}-\d{2}$/.test(s) && !isNaN(new Date(s).getTime())
}

// A much larger pool than the old 7-verse list, spread widely across OT/NT,
// so the no-API-key fallback path has real day-to-day variety.
const FALLBACK_REFS = [
  'GEN.1.1', 'GEN.28.15', 'EXO.14.14', 'EXO.20.3', 'DEU.31.6', 'DEU.31.8', 'JOS.1.9',
  'JOS.24.15', 'RUT.1.16', '1SA.16.7', '2SA.22.3', '1KI.8.57', '1CH.16.11', '2CH.7.14',
  'NEH.8.10', 'EST.4.14', 'JOB.19.25', 'JOB.42.2', 'PSA.1.1', 'PSA.16.11', 'PSA.19.1',
  'PSA.23.1', 'PSA.27.1', 'PSA.30.5', 'PSA.34.18', 'PSA.37.4', 'PSA.46.1', 'PSA.51.10',
  'PSA.62.1', 'PSA.90.12', 'PSA.91.1', 'PSA.100.5', 'PSA.103.12', 'PSA.118.24',
  'PSA.119.105', 'PSA.121.1', 'PSA.126.5', 'PSA.139.14', 'PSA.145.18', 'PSA.147.3',
  'PRO.3.5', 'PRO.3.6', 'PRO.16.3', 'PRO.16.9', 'PRO.17.17', 'PRO.18.10', 'PRO.22.6',
  'PRO.31.25', 'ECC.3.1', 'ISA.6.8', 'ISA.9.6', 'ISA.26.3', 'ISA.40.31', 'ISA.41.10',
  'ISA.43.2', 'ISA.53.5', 'ISA.55.8', 'ISA.55.11', 'JER.17.7', 'JER.29.11', 'JER.33.3',
  'LAM.3.22', 'LAM.3.23', 'EZK.36.26', 'DAN.3.17', 'HOS.6.3', 'JOL.2.25', 'AMO.5.24',
  'MIC.6.8', 'NAM.1.7', 'HAB.3.19', 'ZEP.3.17', 'ZEC.4.6', 'MAL.3.10', 'MAT.5.4',
  'MAT.5.9', 'MAT.6.33', 'MAT.7.7', 'MAT.11.28', 'MAT.28.19', 'MRK.10.27', 'MRK.11.24',
  'LUK.1.37', 'LUK.6.31', 'LUK.12.34', 'JHN.1.1', 'JHN.3.16', 'JHN.8.32', 'JHN.10.10',
  'JHN.11.25', 'JHN.13.34', 'JHN.14.6', 'JHN.14.27', 'JHN.15.5', 'JHN.16.33', 'ACT.1.8',
  'ACT.2.21', 'ACT.16.31', 'ROM.5.8', 'ROM.8.1', 'ROM.8.28', 'ROM.8.31', 'ROM.10.9',
  'ROM.12.2', 'ROM.15.13', '1CO.10.13', '1CO.13.4', '1CO.13.13', '1CO.15.57', '2CO.1.3',
  '2CO.4.16', '2CO.5.7', '2CO.5.17', '2CO.9.8', '2CO.12.9', 'GAL.2.20', 'GAL.5.22',
  'GAL.6.9', 'EPH.2.8', 'EPH.2.10', 'EPH.3.20', 'EPH.4.32', 'EPH.6.10', 'PHP.1.6',
  'PHP.4.6', 'PHP.4.7', 'PHP.4.13', 'PHP.4.19', 'COL.3.2', 'COL.3.23', '1TH.5.16',
  '1TH.5.18', '2TH.3.3', '1TI.4.12', '2TI.1.7', '2TI.3.16', 'TIT.3.5', 'HEB.4.16',
  'HEB.11.1', 'HEB.11.6', 'HEB.12.1', 'HEB.12.2', 'HEB.13.5', 'JAS.1.2', 'JAS.1.5',
  'JAS.1.17', 'JAS.4.7', '1PE.1.3', '1PE.2.9', '1PE.5.7', '2PE.1.3', '1JN.1.9',
  '1JN.4.8', '1JN.4.18', '1JN.5.4', 'JUD.1.24', 'REV.3.20', 'REV.21.4', 'REV.22.13',
]

// Stable per-date pseudo-random pick (not day-of-month, which repeats every
// month at the same day) among whichever fallback refs weren't shown recently.
function seededIndex(seed: string, mod: number): number {
  let hash = 0
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) >>> 0
  return hash % mod
}

function pickFallbackRef(date: string, recentKeys: Set<string>): string {
  const candidates = FALLBACK_REFS.filter(ref => !recentKeys.has(ref.split('.').slice(0, 2).join('.')))
  const pool = candidates.length > 0 ? candidates : FALLBACK_REFS
  return pool[seededIndex(date, pool.length)]
}

// Verses (by book+chapter) already served in the last few weeks, so today's
// pick -- AI-generated or fallback -- doesn't repeat one still fresh in the
// reader's memory.
async function getRecentBookChapters(beforeDate: string, days = 21): Promise<Set<string>> {
  try {
    const since = new Date(new Date(beforeDate).getTime() - days * 86400000).toISOString().slice(0, 10)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rows = await (prisma as any).dailyGenerated.findMany({
      where: { date: { gte: since, lt: beforeDate } },
      select: { book_id: true, chapter: true },
    })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return new Set(rows.map((r: any) => `${r.book_id}.${r.chapter}`))
  } catch {
    return new Set()
  }
}

async function generateTodayEntry(date: string) {
  const anthropicKey = process.env.ANTHROPIC_API_KEY
  const recentKeys = await getRecentBookChapters(date)

  let bookId = 'PSA', chapter = 46, verse = 1
  let title = 'God is Our Refuge', reflection = '', prayer = '', challenge = '', reflectionQuestion = ''

  if (anthropicKey) {
    try {
      const recentList = Array.from(recentKeys).join(', ')
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': anthropicKey, 'anthropic-version': '2023-06-01' },
        body: JSON.stringify({
          model: 'claude-sonnet-5',
          max_tokens: 800,
          system: 'You are generating a daily devotional for a Christian app. Respond with ONLY valid JSON, no other text, matching exactly: {"book_id": "3-letter USFM code e.g. PSA, JHN, ROM", "chapter": number, "verse": number, "title": "short devotional title", "reflection": "150-250 word reflection connecting to the verse", "prayer": "80-120 word guided prayer", "challenge": "one short practical action for today", "reflection_question": "one short reflective question"}. Pick a different, meaningful verse each time -- do not always pick the most famous ones. Never invent a reference that does not exist.',
          messages: [{
            role: 'user',
            content: recentList
              ? `Generate today's devotional for ${date}. Do not reuse any of these book.chapter references shown in the last 3 weeks: ${recentList}.`
              : `Generate today's devotional for ${date}.`,
          }],
        }),
      })
      if (res.ok) {
        const data = await res.json()
        const text = data.content?.[0]?.text ?? ''
        const parsed = JSON.parse(text.trim())
        const validBook = BOOKS.find(b => b.bookId === parsed.book_id)
        const isRecent = recentKeys.has(`${parsed.book_id}.${parsed.chapter}`)
        if (validBook && !isRecent && Number(parsed.chapter) > 0 && Number(parsed.chapter) <= validBook.chapterCount) {
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
    const ref = pickFallbackRef(date, recentKeys)
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
    book_id: bookId,
    chapter,
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
    const localDateParam = req.nextUrl.searchParams.get('local_date')
    const baseDate = isValidDateKey(localDateParam) ? localDateParam : todayKey()
    const targetDate = new Date(new Date(baseDate).getTime() + offset * 86400000).toISOString().slice(0, 10)

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = prisma as any
    const existing = await db.dailyGenerated.findUnique({ where: { date: targetDate } })
    if (existing) return successResponse(existing, 'Daily encouragement retrieved.')

    if (targetDate !== baseDate) {
      const today = await db.dailyGenerated.findUnique({ where: { date: baseDate } })
      if (today) return successResponse(today, 'Daily encouragement retrieved.')
    }

    const entry = await generateTodayEntry(targetDate)
    return successResponse(entry, 'Daily encouragement retrieved.')
  } catch (error) {
    console.error('[Daily] Error:', error)
    return serverErrorResponse()
  }
}
