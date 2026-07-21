import { NextRequest } from 'next/server'
import { withAuth } from '@/lib/auth/middleware'
import { successResponse, createdResponse, validationErrorResponse, serverErrorResponse } from '@/lib/api-response'
import { CreatePrayerSchema } from '@/lib/validation/schemas'
import { prisma } from '@/lib/db/client'
import { z } from 'zod'

// ASD §7.3 Prayer Journal API — GET /prayers, POST /prayers
// Private by architecture, not by setting: every query below is scoped to the
// authenticated user's own id. There is no privacy_level column on this table
// (DSD §2.12) and no code path in this route ever queries across users.

export const GET = withAuth(async (req: NextRequest, user) => {
  try {
    const category = req.nextUrl.searchParams.get('category')
    const status   = req.nextUrl.searchParams.get('status')
    const tag      = req.nextUrl.searchParams.get('tag')
    const keyword  = req.nextUrl.searchParams.get('q')

    const where: Record<string, unknown> = { user_id: user.id, deleted_at: null }
    if (category) where.category = category
    if (status)   where.status   = status

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let prayers = await (prisma as any).prayer.findMany({
      where,
      orderBy: { updated_at: 'desc' },
    })

    if (tag && Array.isArray(prayers)) {
      const t = tag.toLowerCase()
      prayers = prayers.filter((p: { tags?: string | null }) =>
        p.tags?.toLowerCase().split(',').map((x: string) => x.trim()).includes(t)
      )
    }

    if (keyword && Array.isArray(prayers)) {
      const q = keyword.toLowerCase()
      prayers = prayers.filter((p: { title?: string; content?: string }) =>
        p.title?.toLowerCase().includes(q) || p.content?.toLowerCase().includes(q)
      )
    }

    return successResponse(prayers, 'Prayer journal retrieved successfully.')
  } catch {
    return serverErrorResponse()
  }
})

export const POST = withAuth(async (req: NextRequest, user) => {
  try {
    const body      = await req.json()
    const validated = CreatePrayerSchema.parse(body)

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const prayer = await (prisma as any).prayer.create({
      data: {
        user_id:             user.id,
        title:               validated.title,
        content:             validated.content,
        category:            validated.category,
        tags:                validated.tags,
        scripture_reference: validated.scripture_reference,
      },
    })

    return createdResponse(prayer, 'Prayer saved.')
  } catch (error) {
    if (error instanceof z.ZodError) return validationErrorResponse(error)
    return serverErrorResponse()
  }
})
