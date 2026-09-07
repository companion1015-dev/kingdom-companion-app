import { NextRequest } from 'next/server'
import { z } from 'zod'
import { successResponse, validationErrorResponse, serverErrorResponse } from '@/lib/api-response'
import { prisma } from '@/lib/db/client'

// POST /api/v1/push/resubscribe -- called by worker/index.js's
// `pushsubscriptionchange` handler when the browser silently rotates a
// subscription's endpoint. Carries the old endpoint over the existing
// row's preferences (timezone/preferred hour/last_sent_date) rather than
// losing them and starting over.

const ResubscribeSchema = z.object({
  oldEndpoint: z.string().url().nullable(),
  subscription: z.object({
    endpoint: z.string().url(),
    keys: z.object({
      p256dh: z.string().min(1),
      auth:   z.string().min(1),
    }),
  }),
})

export async function POST(req: NextRequest) {
  try {
    const { oldEndpoint, subscription } = ResubscribeSchema.parse(await req.json())
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = prisma as any

    const existing = oldEndpoint
      ? await db.pushSubscription.findUnique({ where: { endpoint: oldEndpoint } })
      : null

    if (existing) {
      await db.pushSubscription.update({
        where: { id: existing.id },
        data: {
          endpoint: subscription.endpoint,
          p256dh:   subscription.keys.p256dh,
          auth:     subscription.keys.auth,
        },
      })
    } else {
      await db.pushSubscription.upsert({
        where: { endpoint: subscription.endpoint },
        create: {
          endpoint: subscription.endpoint,
          p256dh:   subscription.keys.p256dh,
          auth:     subscription.keys.auth,
        },
        update: {
          p256dh: subscription.keys.p256dh,
          auth:   subscription.keys.auth,
        },
      })
    }

    return successResponse(null, 'Subscription updated.')
  } catch (error) {
    if (error instanceof z.ZodError) return validationErrorResponse(error)
    console.error('[Push] resubscribe error:', error)
    return serverErrorResponse()
  }
}
