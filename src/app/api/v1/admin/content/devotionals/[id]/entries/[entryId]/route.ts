import { NextRequest } from 'next/server'
import { withAdmin } from '@/lib/auth/middleware'
import { successResponse, notFoundResponse, serverErrorResponse } from '@/lib/api-response'
import { prisma } from '@/lib/db/client'

// PATCH/DELETE /api/v1/admin/content/devotionals/:id/entries/:entryId

export const PATCH = withAdmin(async (req: NextRequest, _user, context) => {
  try {
    const { id: seriesId, entryId } = context!.params
    const body = await req.json()
    const {
      day_number, title, theme, translation_id, book_id, chapter,
      central_verse_id, central_verse_reference, reflection, guided_prayer,
      practical_application, is_ai_generated, ai_disclosure_text,
    } = body

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = prisma as any
    const existing = await db.devotionalEntry.findFirst({ where: { id: entryId, devotional_series_id: seriesId } })
    if (!existing) return notFoundResponse('Devotional entry')

    const data: Record<string, unknown> = {}
    if (day_number !== undefined)               data.day_number = Number(day_number)
    if (title !== undefined)                    data.title = title.trim()
    if (theme !== undefined)                     data.theme = theme?.trim() || null
    if (translation_id !== undefined)            data.translation_id = translation_id
    if (book_id !== undefined)                   data.book_id = book_id
    if (chapter !== undefined)                   data.chapter = Number(chapter)
    if (central_verse_id !== undefined)          data.central_verse_id = central_verse_id
    if (central_verse_reference !== undefined)   data.central_verse_reference = central_verse_reference.trim()
    if (reflection !== undefined)                data.reflection = reflection.trim()
    if (guided_prayer !== undefined)             data.guided_prayer = guided_prayer.trim()
    if (practical_application !== undefined)     data.practical_application = practical_application?.trim() || null
    if (is_ai_generated !== undefined)           data.is_ai_generated = !!is_ai_generated
    if (ai_disclosure_text !== undefined)        data.ai_disclosure_text = ai_disclosure_text?.trim() || null

    const updated = await db.devotionalEntry.update({ where: { id: entryId }, data })
    return successResponse(updated, 'Devotional entry updated.')
  } catch (error) {
    console.error('[AdminContent] Devotional entry update error:', error)
    return serverErrorResponse()
  }
})

export const DELETE = withAdmin(async (_req: NextRequest, _user, context) => {
  try {
    const { id: seriesId, entryId } = context!.params
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = prisma as any
    const existing = await db.devotionalEntry.findFirst({ where: { id: entryId, devotional_series_id: seriesId } })
    if (!existing) return notFoundResponse('Devotional entry')
    await db.devotionalEntry.delete({ where: { id: entryId } })
    return successResponse({ deleted: true }, 'Devotional entry deleted.')
  } catch (error) {
    console.error('[AdminContent] Devotional entry delete error:', error)
    return serverErrorResponse()
  }
})
