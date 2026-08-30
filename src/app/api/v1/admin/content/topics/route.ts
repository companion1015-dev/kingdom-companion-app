import { NextRequest } from 'next/server'
import { withAdmin } from '@/lib/auth/middleware'
import { successResponse, createdResponse, errorResponse, serverErrorResponse } from '@/lib/api-response'
import { prisma } from '@/lib/db/client'

// GET/POST /api/v1/admin/content/topics
// Admin CMS for the Topics Discovery module (public reader: /api/v1/topics).
// Unlike the public route, this lists every topic regardless of
// is_published so admins can manage drafts before they go live.

export const GET = withAdmin(async () => {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const topics = await (prisma as any).topic.findMany({
      orderBy: { created_at: 'desc' },
      include: { _count: { select: { verses: true } } },
    })
    return successResponse(topics, 'Topics retrieved.')
  } catch (error) {
    console.error('[AdminContent] Topics list error:', error)
    return serverErrorResponse()
  }
})

type VerseInput = {
  translation_id: string; book_id: string; chapter: number
  verse_id: string; verse_reference: string; display_order?: number
}

export const POST = withAdmin(async (req: NextRequest) => {
  try {
    const body = await req.json()
    const { slug, name, category, description, is_published, verses } = body

    if (!slug?.trim() || !name?.trim() || !category?.trim() || !description?.trim()) {
      return errorResponse('MISSING_FIELDS', 'slug, name, category and description are required.', 400)
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = prisma as any
    const existing = await db.topic.findUnique({ where: { slug: slug.trim() } })
    if (existing) return errorResponse('DUPLICATE_SLUG', `A topic with slug "${slug}" already exists.`, 409)

    const topic = await db.topic.create({
      data: {
        slug: slug.trim(), name: name.trim(), category: category.trim(),
        description: description.trim(), is_published: is_published ?? true,
        verses: Array.isArray(verses) && verses.length > 0 ? {
          create: verses.map((v: VerseInput, i: number) => ({
            translation_id: v.translation_id, book_id: v.book_id, chapter: Number(v.chapter),
            verse_id: v.verse_id, verse_reference: v.verse_reference, display_order: v.display_order ?? i,
          })),
        } : undefined,
      },
      include: { verses: true },
    })

    return createdResponse(topic, 'Topic created.')
  } catch (error) {
    console.error('[AdminContent] Topic create error:', error)
    return serverErrorResponse()
  }
})
