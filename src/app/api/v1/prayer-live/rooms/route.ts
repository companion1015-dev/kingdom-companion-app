import { NextRequest } from 'next/server'
import { z } from 'zod'
import { withAdmin } from '@/lib/auth/middleware'
import { prisma } from '@/lib/db/client'
import { successResponse, createdResponse, validationErrorResponse, serverErrorResponse } from '@/lib/api-response'

/**
 * GET /api/v1/prayer-live/rooms
 * Public — no auth. Blueprint Section 2: watching (and seeing what's live)
 * never requires an account. Only joining the actual video does.
 */
export async function GET() {
  try {
    const rooms = await prisma.prayerLiveRoom.findMany({
      where: { deleted_at: null },
      orderBy: { created_at: 'desc' },
      select: {
        room_name: true,
        title: true,
        is_live: true,
        started_at: true,
        scheduled_at: true,
      },
    })
    return successResponse(rooms, 'Prayer rooms retrieved successfully.')
  } catch {
    return serverErrorResponse()
  }
}

const CreateRoomSchema = z.object({
  room_name: z.string().min(1).max(100),
  title: z.string().min(1).max(255),
  scheduled_at: z.string().datetime().optional(),
})

/**
 * POST /api/v1/prayer-live/rooms
 * Admin-only — Section 3: room scheduling is an Administrator action.
 */
export const POST = withAdmin(async (req: NextRequest) => {
  try {
    const body = await req.json()
    const validated = CreateRoomSchema.parse(body)

    const room = await prisma.prayerLiveRoom.create({
      data: {
        room_name: validated.room_name,
        title: validated.title,
        scheduled_at: validated.scheduled_at ? new Date(validated.scheduled_at) : null,
      },
    })

    return createdResponse(room, 'Prayer room scheduled.')
  } catch (error) {
    if (error instanceof z.ZodError) return validationErrorResponse(error)
    return serverErrorResponse()
  }
})
