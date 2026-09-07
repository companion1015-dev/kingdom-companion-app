import { NextRequest } from 'next/server'
import { z } from 'zod'
import { successResponse, createdResponse, validationErrorResponse, serverErrorResponse } from '@/lib/api-response'
import { prisma } from '@/lib/db/client'

// POST /api/v1/push/subscribe -- registers (or updates) a browser push
// subscription for the Daily Devotional reminder. Public: works for signed
// in and anonymous visitors alike, matching DailyDevotionalPopup's
// once-per-day reminder being shown to every visitor regardless of auth
// state.

const SubscribeSchema = z.object({
  subscription: z.object({
    endpoint: z.string().url(),
    keys: z.object({
      p256dh: z.string().min(1),
      auth:   z.string().min(1),
    }),
  }),
  timezoneOffsetMinutes: z.number().int().min(-840).max(840),
  preferredHour:         z.number().int().min(0).max(23).optional(),
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { subscription, timezoneOffsetMinutes, preferredHour } = SubscribeSchema.parse(body)

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = prisma as any
    const existing = await db.pushSubscription.findUnique({ where: { endpoint: subscription.endpoint } })

    const data = {
      endpoint:                subscription.endpoint,
      p256dh:                  subscription.keys.p256dh,
      auth:                    subscription.keys.auth,
      timezone_offset_minutes: timezoneOffsetMinutes,
      preferred_hour:          preferredHour ?? 8,
    }

    if (existing) {
      const updated = await db.pushSubscription.update({ where: { id: existing.id }, data })
      return successResponse({ id: updated.id }, 'Reminder subscription updated.')
    }

    const created = await db.pushSubscription.create({ data })
    return createdResponse({ id: created.id }, 'Daily reminder enabled.')
  } catch (error) {
    if (error instanceof z.ZodError) return validationErrorResponse(error)
    console.error('[Push] subscribe error:', error)
    return serverErrorResponse()
  }
}
