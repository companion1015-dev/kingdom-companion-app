import { NextRequest } from 'next/server'
import { withOptionalAuth } from '@/lib/auth/middleware'
import { successResponse, createdResponse, errorResponse, serverErrorResponse } from '@/lib/api-response'
import { checkRateLimit, getRateLimitKey } from '@/lib/auth/rate-limit'
import { prisma } from '@/lib/db/client'

// POST /api/v1/feedback
// Real backing for the Contact page -- previously that page didn't exist
// at all (the footer linked straight to a 404). Saves to the Feedback
// table, which already existed in the schema but had no route using it.

const FEEDBACK_RATE = { limit: 5, windowMs: 60 * 60 * 1000 }
const VALID_TYPES = ['Bug Report', 'Feature Request', 'General Feedback']

export const POST = withOptionalAuth(async (req: NextRequest, user) => {
  const ip = req.headers.get('x-forwarded-for') ?? 'unknown'
  const { allowed } = checkRateLimit(getRateLimitKey('feedback', ip), FEEDBACK_RATE)
  if (!allowed) return errorResponse('RATE_LIMITED', 'Too many messages sent. Please try again later.', 429)

  try {
    const body = await req.json()
    const { feedback_type, subject, message } = body

    if (!subject?.trim() || !message?.trim()) {
      return errorResponse('MISSING_FIELDS', 'Please provide a subject and message.', 400)
    }
    if (message.trim().length < 10) {
      return errorResponse('MESSAGE_TOO_SHORT', 'Please write a bit more detail in your message.', 400)
    }

    const type = VALID_TYPES.includes(feedback_type) ? feedback_type : 'General Feedback'

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const created = await (prisma as any).feedback.create({
      data: {
        user_id: user?.id ?? null,
        feedback_type: type,
        subject: subject.trim().slice(0, 255),
        message: message.trim(),
      },
      select: { id: true },
    })

    return createdResponse({ id: created.id }, 'Message sent. Thank you for reaching out.')
  } catch (error) {
    console.error('[Feedback] Error:', error)
    return serverErrorResponse()
  }
})