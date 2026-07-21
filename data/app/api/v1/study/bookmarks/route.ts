import { NextRequest } from 'next/server'
import { withAuth } from '@/lib/auth/middleware'
import { successResponse, createdResponse, validationErrorResponse, serverErrorResponse } from '@/lib/api-response'
import { CreateBookmarkSchema } from '@/lib/validation/schemas'
import { prisma } from '@/lib/db/client'
import { z } from 'zod'

export const GET = withAuth(async (_req, user) => {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const bookmarks = await (prisma as any).bookmark.findMany({
      where:   { user_id: user.id, deleted_at: null },
      orderBy: { created_at: 'desc' },
    })
    return successResponse(bookmarks, 'Bookmarks retrieved successfully.')
  } catch {
    return serverErrorResponse()
  }
})

export const POST = withAuth(async (req, user) => {
  try {
    const body      = await req.json()
    const validated = CreateBookmarkSchema.parse(body)

    // Check for duplicate
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const existing = await (prisma as any).bookmark.findMany({
      where: { user_id: user.id, verse_id: validated.verse_id, deleted_at: null },
    })
    if (existing?.length > 0) {
      return successResponse(existing[0], 'Already bookmarked.')
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const bookmark = await (prisma as any).bookmark.create({
      data: {
        user_id:         user.id,
        translation_id:  validated.translation_id,
        book_id:         validated.book_id,
        chapter:         validated.chapter,
        verse_id:        validated.verse_id,
        verse_reference: validated.verse_reference,
        collection_name: validated.collection_name ?? null,
        tags:            validated.tags ?? [],
      },
    })
    return createdResponse(bookmark, 'Verse bookmarked.')
  } catch (error) {
    if (error instanceof z.ZodError) return validationErrorResponse(error)
    return serverErrorResponse()
  }
})
