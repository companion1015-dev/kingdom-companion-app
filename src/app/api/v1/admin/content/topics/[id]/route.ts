import { NextRequest } from 'next/server'
import { withAdmin } from '@/lib/auth/middleware'
import { successResponse, notFoundResponse, errorResponse, serverErrorResponse } from '@/lib/api-response'
import { prisma } from '@/lib/db/client'

// GET/PATCH/DELETE /api/v1/admin/content/topics/:id

type VerseInput = {
  translation_id: string; book_id: string; chapter: number
  verse_id: string; verse_reference: string; display_order?: number
}

export const GET = withAdmin(async (_req: NextRequest, _user, context) => {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const topic = await (prisma as any).topic.findUnique({
      where: { id: context!.params.id },
      include: { verses: { orderBy: { display_order: 'asc' } } },
    })
    if (!topic) return notFoundResponse('Topic')
    return successResponse(topic, 'Topic retrieved.')
  } catch (error) {
    console.error('[AdminContent] Topic get error:', error)
    return serverErrorResponse()
  }
})

export const PATCH = withAdmin(async (req: NextRequest, _user, context) => {
  try {
    const id = context!.params.id
    const body = await req.json()
    const { slug, name, category, description, is_published, verses } = body

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = prisma as any
    const existing = await db.topic.findUnique({ where: { id } })
    if (!existing) return notFoundResponse('Topic')

    if (slug && slug.trim() !== existing.slug) {
      const clash = await db.topic.findUnique({ where: { slug: slug.trim() } })
      if (clash) return errorResponse('DUPLICATE_SLUG', `A topic with slug "${slug}" already exists.`, 409)
    }

    const data: Record<string, unknown> = {}
    if (slug !== undefined)        data.slug = slug.trim()
    if (name !== undefined)        data.name = name.trim()
    if (category !== undefined)    data.category = category.trim()
    if (description !== undefined) data.description = description.trim()
    if (is_published !== undefined) data.is_published = !!is_published

    const topic = await db.$transaction(async (tx: typeof db) => {
      const updated = await tx.topic.update({ where: { id }, data })
      if (Array.isArray(verses)) {
        await tx.topicVerse.deleteMany({ where: { topic_id: id } })
        if (verses.length > 0) {
          await tx.topicVerse.createMany({
            data: verses.map((v: VerseInput, i: number) => ({
              topic_id: id, translation_id: v.translation_id, book_id: v.book_id,
              chapter: Number(v.chapter), verse_id: v.verse_id, verse_reference: v.verse_reference,
              display_order: v.display_order ?? i,
            })),
          })
        }
      }
      return tx.topic.findUnique({ where: { id }, include: { verses: { orderBy: { display_order: 'asc' } } } })
    })

    return successResponse(topic, 'Topic updated.')
  } catch (error) {
    console.error('[AdminContent] Topic update error:', error)
    return serverErrorResponse()
  }
})

export const DELETE = withAdmin(async (_req: NextRequest, _user, context) => {
  try {
    const id = context!.params.id
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = prisma as any
    const existing = await db.topic.findUnique({ where: { id } })
    if (!existing) return notFoundResponse('Topic')
    await db.topic.delete({ where: { id } })
    return successResponse({ deleted: true }, 'Topic deleted.')
  } catch (error) {
    console.error('[AdminContent] Topic delete error:', error)
    return serverErrorResponse()
  }
})
