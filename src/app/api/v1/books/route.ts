import { successResponse, serverErrorResponse } from '@/lib/api-response'
import { prisma } from '@/lib/db/client'

// GET /api/v1/books -- public, no account required, matching the
// established convention for /topics, /devotionals, /reading-plans.
//
// Merges two distinct content types into one list so /books stays the
// single home for "books" rather than splitting into a second nav item:
//   - kind: 'download' -- LibraryBook, an uploaded PDF/EPUB/DOCX file
//   - kind: 'read'     -- DiscipleshipBook, a structured multi-chapter
//     teaching book (e.g. "Salvation & New Life") rendered in-app as a
//     real reading experience via /books/read/[slug]/[chapter]

export async function GET() {
  try {
    const [downloadBooks, readBooks] = await Promise.all([
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (prisma as any).libraryBook.findMany({
        where: { is_published: true },
        select: {
          id: true, title: true, author_name: true, description: true,
          cover_image_url: true, file_url: true, file_type: true, created_at: true,
        },
      }),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (prisma as any).discipleshipBook.findMany({
        where: { is_published: true },
        select: {
          id: true, slug: true, title: true, subtitle: true, author_name: true,
          volume_number: true, description: true, cover_image_url: true, created_at: true,
          _count: { select: { chapters: true } },
        },
      }),
    ])

    const books = [
      ...downloadBooks.map((b: Record<string, unknown>) => ({ ...b, kind: 'download' as const })),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ...readBooks.map((b: any) => ({
        id: b.id, slug: b.slug, title: b.title, subtitle: b.subtitle,
        author_name: b.author_name, volume_number: b.volume_number,
        description: b.description, cover_image_url: b.cover_image_url,
        created_at: b.created_at, chapter_count: b._count.chapters,
        kind: 'read' as const,
      })),
    ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

    return successResponse(books, 'Books retrieved successfully.')
  } catch {
    return serverErrorResponse()
  }
}
