import { NextRequest } from 'next/server'
import { withAuth, withOptionalAuth } from '@/lib/auth/middleware'
import { successResponse, createdResponse, validationErrorResponse, serverErrorResponse } from '@/lib/api-response'
import { CreateHighlightSchema } from '@/lib/validation/schemas'
import { prisma } from '@/lib/db/client'
import { z } from 'zod'

// GET /api/v1/study/highlights — fetch all highlights for authenticated user
export const GET = withAuth(async (_req, user) => {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const highlights = await (prisma as any).highlight.findMany({
      where:   { user_id: user.id, deleted_at: null },
      orderBy: { created_at: 'desc' },
    })
    return successResponse(highlights, 'Highlights retrieved successfully.')
  } catch {
    return serverErrorResponse()
  }
})

// POST /api/v1/study/highlights — create a highlight
export const POST = withAuth(async (req, user) => {
  try {
    const body      = await req.json()
    const validated = CreateHighlightSchema.parse(body)

    // Upsert: if verse already highlighted, update the colour
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const existing = await (prisma as any).highlight.findMany({
      where: {
        user_id:  user.id,
        verse_id: validated.verse_id,
        deleted_at: null,
      },
    })

    let highlight
    if (existing?.length > 0) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      highlight = await (prisma as any).highlight.update({
        where: { id: existing[0].id },
        data:  { color: validated.color, updated_at: new Date() },
      })
    } else {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      highlight = await (prisma as any).highlight.create({
        data: {
          user_id:         user.id,
          translation_id:  validated.translation_id,
          book_id:         validated.book_id,
          chapter:         validated.chapter,
          verse_id:        validated.verse_id,
          verse_reference: validated.verse_reference,
          color:           validated.color,
        },
      })
    }

    return createdResponse(highlight, 'Highlight saved.')
  } catch (error) {
    if (error instanceof z.ZodError) return validationErrorResponse(error)
    return serverErrorResponse()
  }
})
