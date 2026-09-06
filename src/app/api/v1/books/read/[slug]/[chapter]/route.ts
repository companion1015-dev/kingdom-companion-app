import { NextRequest } from 'next/server'
import { successResponse, notFoundResponse, serverErrorResponse } from '@/lib/api-response'
import { prisma } from '@/lib/db/client'

// GET /api/v1/books/read/{slug}/{chapter} -- public. Returns one chapter's
// full content plus enough about the parent book and sibling chapters to
// render prev/next navigation and a breadcrumb without a second round trip.

export async function GET(_req: NextRequest, ctx: { params: { slug: string; chapter: string } }) {
  try {
    const chapterNumber = Number(ctx.params.chapter)
    if (!Number.isInteger(chapterNumber) || chapterNumber < 1) return notFoundResponse('Chapter')

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const book = await (prisma as any).discipleshipBook.findUnique({
      where: { slug: ctx.params.slug },
      include: {
        chapters: {
          orderBy: { chapter_number: 'asc' },
          select: { chapter_number: true, title: true },
        },
      },
    })
    if (!book || !book.is_published) return notFoundResponse('Book')

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const chapter = await (prisma as any).discipleshipChapter.findUnique({
      where: { book_id_chapter_number: { book_id: book.id, chapter_number: chapterNumber } },
    })
    if (!chapter) return notFoundResponse('Chapter')

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const chapters: { chapter_number: number; title: string }[] = book.chapters
    const prev = chapters.find(c => c.chapter_number === chapterNumber - 1) ?? null
    const next = chapters.find(c => c.chapter_number === chapterNumber + 1) ?? null

    return successResponse({
      book: { slug: book.slug, title: book.title, subtitle: book.subtitle },
      chapter,
      totalChapters: chapters.length,
      prev,
      next,
    }, 'Chapter retrieved successfully.')
  } catch {
    return serverErrorResponse()
  }
}
