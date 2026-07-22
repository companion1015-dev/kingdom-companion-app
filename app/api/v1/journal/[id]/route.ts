import { NextRequest } from 'next/server'
import { withAuth } from '@/lib/auth/middleware'
import { successResponse, notFoundResponse, forbiddenResponse, validationErrorResponse, serverErrorResponse } from '@/lib/api-response'
import { UpdatePrayerSchema } from '@/lib/validation/schemas'
import { prisma } from '@/lib/db/client'
import { z } from 'zod'

// ASD §7.3 — PATCH /prayers/{id} (also handles "mark answered" and "archive"
// via the status field, matching this codebase's existing single-PATCH
// convention rather than the ASD's separate /answered and /archive endpoints.
// ASSUMPTION — REQUIRES PRODUCT DECISION: this is a reversible simplification;
// split into dedicated endpoints later if the client needs them distinctly.

export const PATCH = withAuth(async (req: NextRequest, user, ctx) => {
  try {
    const id   = ctx?.params.id
    const body = await req.json()
    const validated = UpdatePrayerSchema.parse(body)

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const prayer = await (prisma as any).prayer.findUnique({ where: { id } })
    if (!prayer || prayer.deleted_at) return notFoundResponse('Prayer')
    if (prayer.user_id !== user.id) return forbiddenResponse()

    const becomingAnswered = validated.status === 'answered' && prayer.status !== 'answered'

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updated = await (prisma as any).prayer.update({
      where: { id },
      data: {
        ...(validated.title               !== undefined && { title:               validated.title }),
        ...(validated.content             !== undefined && { content:             validated.content }),
        ...(validated.category            !== undefined && { category:            validated.category }),
        ...(validated.tags                !== undefined && { tags:                validated.tags }),
        ...(validated.scripture_reference !== undefined && { scripture_reference: validated.scripture_reference }),
        ...(validated.status              !== undefined && { status:              validated.status }),
        ...(becomingAnswered && { answered_at: new Date() }),
        updated_at: new Date(),
      },
    })

    return successResponse(updated, 'Prayer updated.')
  } catch (error) {
    if (error instanceof z.ZodError) return validationErrorResponse(error)
    return serverErrorResponse()
  }
})

export const DELETE = withAuth(async (_req: NextRequest, user, ctx) => {
  try {
    const id = ctx?.params.id
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const prayer = await (prisma as any).prayer.findUnique({ where: { id } })
    if (!prayer || prayer.deleted_at) return notFoundResponse('Prayer')
    if (prayer.user_id !== user.id) return forbiddenResponse()

    // Soft delete — DSD §2.12 / document 14's 30-day retention default applies;
    // permanent purge is a scheduled job, not performed synchronously here.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (prisma as any).prayer.update({
      where: { id },
      data:  { deleted_at: new Date() },
    })

    return successResponse(null, 'Prayer deleted.')
  } catch {
    return serverErrorResponse()
  }
})
