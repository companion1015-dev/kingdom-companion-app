import { NextRequest } from 'next/server'
import { withAdmin } from '@/lib/auth/middleware'
import { successResponse, createdResponse, errorResponse, serverErrorResponse } from '@/lib/api-response'
import { prisma } from '@/lib/db/client'

// GET/POST /api/v1/admin/content/daily
// Admin CMS for Daily Encouragement (public reader: /api/v1/daily). The
// public route already reads DailyGenerated.date first and only falls back
// to AI generation when no row exists -- so writing a row here for
// today/a future date pre-empts generation for that date with no other
// wiring needed. Existing AI-generated rows can also be edited or
// overwritten here.

export const GET = withAdmin(async (req: NextRequest) => {
  try {
    const from = req.nextUrl.searchParams.get('from') // YYYY-MM-DD, inclusive
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const entries = await (prisma as any).dailyGenerated.findMany({
      where: from ? { date: { gte: from } } : undefined,
      orderBy: { date: 'desc' },
      take: 60,
    })
    return successResponse(entries, 'Daily encouragement entries retrieved.')
  } catch (error) {
    console.error('[AdminContent] Daily list error:', error)
    return serverErrorResponse()
  }
})

export const POST = withAdmin(async (req: NextRequest) => {
  try {
    const body = await req.json()
    const {
      date, verse_reference, verse_text, translation, book_id, chapter,
      title, reflection, prayer, challenge, reflection_question,
    } = body

    if (!/^\d{4}-\d{2}-\d{2}$/.test(date ?? '')) {
      return errorResponse('INVALID_DATE', 'date must be in YYYY-MM-DD format.', 400)
    }
    if (!verse_reference?.trim() || !verse_text?.trim() || !book_id || !chapter ||
        !title?.trim() || !reflection?.trim() || !prayer?.trim() || !challenge?.trim() || !reflection_question?.trim()) {
      return errorResponse('MISSING_FIELDS', 'All fields are required.', 400)
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = prisma as any
    const existing = await db.dailyGenerated.findUnique({ where: { date } })
    if (existing) return errorResponse('DUPLICATE_DATE', `An entry for ${date} already exists. Edit it instead.`, 409)

    const created = await db.dailyGenerated.create({
      data: {
        date, verse_reference: verse_reference.trim(), verse_text: verse_text.trim(),
        translation: translation || 'BSB', book_id, chapter: Number(chapter),
        title: title.trim(), reflection: reflection.trim(), prayer: prayer.trim(),
        challenge: challenge.trim(), reflection_question: reflection_question.trim(),
      },
    })

    return createdResponse(created, 'Daily encouragement entry created.')
  } catch (error) {
    console.error('[AdminContent] Daily create error:', error)
    return serverErrorResponse()
  }
})
