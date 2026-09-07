import { NextRequest } from 'next/server'
import { z } from 'zod'
import { successResponse, validationErrorResponse, serverErrorResponse } from '@/lib/api-response'
import { prisma } from '@/lib/db/client'

// POST /api/v1/push/unsubscribe -- removes a browser's push subscription
// (e.g. if a future "turn off reminders" control is added, or a device
// reports its own subscription as invalid).

const UnsubscribeSchema = z.object({ endpoint: z.string().url() })

export async function POST(req: NextRequest) {
  try {
    const { endpoint } = UnsubscribeSchema.parse(await req.json())
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (prisma as any).pushSubscription.deleteMany({ where: { endpoint } })
    return successResponse(null, 'Daily reminder turned off.')
  } catch (error) {
    if (error instanceof z.ZodError) return validationErrorResponse(error)
    console.error('[Push] unsubscribe error:', error)
    return serverErrorResponse()
  }
}
