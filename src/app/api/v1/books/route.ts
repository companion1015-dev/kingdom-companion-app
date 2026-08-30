import { successResponse, serverErrorResponse } from '@/lib/api-response'
import { prisma } from '@/lib/db/client'

// GET /api/v1/books -- public, no account required, matching the
// established convention for /topics, /devotionals, /reading-plans.

export async function GET() {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const books = await (prisma as any).libraryBook.findMany({
      where: { is_published: true },
      orderBy: { created_at: 'desc' },
      select: {
        id: true, title: true, author_name: true, description: true,
        cover_image_url: true, file_url: true, file_type: true, created_at: true,
      },
    })
    return successResponse(books, 'Books retrieved successfully.')
  } catch {
    return serverErrorResponse()
  }
}
