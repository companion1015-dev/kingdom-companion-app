import { NextRequest } from 'next/server'
import { withAdmin } from '@/lib/auth/middleware'
import { createdResponse, notFoundResponse, errorResponse, serverErrorResponse } from '@/lib/api-response'
import { prisma } from '@/lib/db/client'

// POST /api/v1/admin/content/devotionals/:id/entries -- add one day to a series.

export const POST = withAdmin(async (req: NextRequest, _user, context) => {
  try {
    const seriesId = context!.params.id
    const body = await req.json()
    const {
      day_number, title, theme, translation_id, book_id, chapter,
      central_verse_id, central_verse_reference, reflection, guided_prayer,
      practical_application, is_ai_generated, ai_disclosure_text,
    } = body

    if (!day_number || !title?.trim() || !translation_id || !book_id || !chapter ||
        !central_verse_id || !central_verse_reference?.trim() || !reflection?.trim() || !guided_prayer?.trim()) {
      return errorResponse('MISSING_FIELDS', 'day_number, title, translation_id, book_id, chapter, central_verse_id, central_verse_reference, reflection and guided_prayer are required.', 400)
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = prisma as any
    const series = await db.devotionalSeries.findUnique({ where: { id: seriesId } })
    if (!series) return notFoundResponse('Devotional series')

    const clash = await db.devotionalEntry.findUnique({
      where: { devotional_series_id_day_number: { devotional_series_id: seriesId, day_number: Number(day_number) } },
    })
    if (clash) return errorResponse('DUPLICATE_DAY', `Day ${day_number} already exists for this series.`, 409)

    const entry = await db.devotionalEntry.create({
      data: {
        devotional_series_id: seriesId, day_number: Number(day_number), title: title.trim(),
        theme: theme?.trim() || null, translation_id, book_id, chapter: Number(chapter),
        central_verse_id, central_verse_reference: central_verse_reference.trim(),
        reflection: reflection.trim(), guided_prayer: guided_prayer.trim(),
        practical_application: practical_application?.trim() || null,
        is_ai_generated: !!is_ai_generated, ai_disclosure_text: ai_disclosure_text?.trim() || null,
      },
    })

    return createdResponse(entry, 'Devotional entry created.')
  } catch (error) {
    console.error('[AdminContent] Devotional entry create error:', error)
    return serverErrorResponse()
  }
})
