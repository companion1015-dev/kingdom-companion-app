import { NextRequest } from 'next/server'
import { successResponse, notFoundResponse, serverErrorResponse } from '@/lib/api-response'
import { prisma } from '@/lib/db/client'

// GET /api/v1/books/read/{slug} -- public. Returns a DiscipleshipBook's
// details plus a lightweight chapter table of contents (no section bodies --
// those load per-chapter from /books/read/{slug}/{chapter}).

export async function GET(_req: NextRequest, ctx: { params: { slug: string } }) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const book = await (prisma as any).discipleshipBook.findUnique({
      where: { slug: ctx.params.slug },
      include: {
        chapters: {
          orderBy: { chapter_number: 'asc' },
          select: { chapter_number: true, title: true, subtitle: true },
        },
      },
    })

    if (!book || !book.is_published) return notFoundResponse('Book')

    return successResponse(book, 'Book retrieved successfully.')
  } catch {
    return serverErrorResponse()
  }
}
