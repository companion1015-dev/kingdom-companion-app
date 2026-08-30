import { NextRequest } from 'next/server'
import { withAdmin } from '@/lib/auth/middleware'
import { successResponse, notFoundResponse, serverErrorResponse } from '@/lib/api-response'
import { prisma } from '@/lib/db/client'

// PATCH/DELETE /api/v1/admin/content/daily/:date (date = YYYY-MM-DD)

export const PATCH = withAdmin(async (req: NextRequest, _user, context) => {
  try {
    const date = context!.params.date
    const body = await req.json()
    const {
      verse_reference, verse_text, translation, book_id, chapter,
      title, reflection, prayer, challenge, reflection_question,
    } = body

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = prisma as any
    const existing = await db.dailyGenerated.findUnique({ where: { date } })
    if (!existing) return notFoundResponse('Daily encouragement entry')

    const data: Record<string, unknown> = {}
    if (verse_reference !== undefined)     data.verse_reference = verse_reference.trim()
    if (verse_text !== undefined)          data.verse_text = verse_text.trim()
    if (translation !== undefined)         data.translation = translation
    if (book_id !== undefined)             data.book_id = book_id
    if (chapter !== undefined)             data.chapter = Number(chapter)
    if (title !== undefined)               data.title = title.trim()
    if (reflection !== undefined)          data.reflection = reflection.trim()
    if (prayer !== undefined)              data.prayer = prayer.trim()
    if (challenge !== undefined)           data.challenge = challenge.trim()
    if (reflection_question !== undefined) data.reflection_question = reflection_question.trim()

    const updated = await db.dailyGenerated.update({ where: { date }, data })
    return successResponse(updated, 'Daily encouragement entry updated.')
  } catch (error) {
    console.error('[AdminContent] Daily update error:', error)
    return serverErrorResponse()
  }
})

export const DELETE = withAdmin(async (_req: NextRequest, _user, context) => {
  try {
    const date = context!.params.date
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = prisma as any
    const existing = await db.dailyGenerated.findUnique({ where: { date } })
    if (!existing) return notFoundResponse('Daily encouragement entry')
    await db.dailyGenerated.delete({ where: { date } })
    return successResponse({ deleted: true }, 'Daily encouragement entry deleted.')
  } catch (error) {
    console.error('[AdminContent] Daily delete error:', error)
    return serverErrorResponse()
  }
})
