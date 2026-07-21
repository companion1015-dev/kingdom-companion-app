import { NextRequest } from 'next/server'
import { withAuth } from '@/lib/auth/middleware'
import { successResponse, createdResponse, validationErrorResponse, serverErrorResponse } from '@/lib/api-response'
import { CreateNoteSchema } from '@/lib/validation/schemas'
import { prisma } from '@/lib/db/client'
import { z } from 'zod'

export const GET = withAuth(async (req: NextRequest, user) => {
  try {
    const verseId = req.nextUrl.searchParams.get('verse_id')
    const keyword = req.nextUrl.searchParams.get('q')

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: Record<string, unknown> = { user_id: user.id, deleted_at: null }
    if (verseId) where.verse_id = verseId

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let notes = await (prisma as any).note.findMany({
      where,
      orderBy: { updated_at: 'desc' },
    })

    // Client-side keyword filter (full-text search to be Algolia in v1.5)
    if (keyword && Array.isArray(notes)) {
      const q = keyword.toLowerCase()
      notes = notes.filter((n: { content?: string; verse_reference?: string }) =>
        n.content?.toLowerCase().includes(q) ||
        n.verse_reference?.toLowerCase().includes(q)
      )
    }

    return successResponse(notes, 'Notes retrieved successfully.')
  } catch {
    return serverErrorResponse()
  }
})

export const POST = withAuth(async (req, user) => {
  try {
    const body      = await req.json()
    const validated = CreateNoteSchema.parse(body)

    // Upsert: one note per verse per user
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const existing = await (prisma as any).note.findMany({
      where: { user_id: user.id, verse_id: validated.verse_id, deleted_at: null },
    })

    let note
    if (existing?.length > 0) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      note = await (prisma as any).note.update({
        where: { id: existing[0].id },
        data:  { content: validated.content, tags: validated.tags ?? [], updated_at: new Date() },
      })
    } else {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      note = await (prisma as any).note.create({
        data: {
          user_id:         user.id,
          translation_id:  validated.translation_id,
          book_id:         validated.book_id,
          chapter:         validated.chapter,
          verse_id:        validated.verse_id,
          verse_reference: validated.verse_reference,
          content:         validated.content,
          tags:            validated.tags ?? [],
        },
      })
    }
    return createdResponse(note, 'Note saved.')
  } catch (error) {
    if (error instanceof z.ZodError) return validationErrorResponse(error)
    return serverErrorResponse()
  }
})
