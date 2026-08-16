import { NextRequest } from 'next/server'
import { withOptionalAuth } from '@/lib/auth/middleware'
import { successResponse, createdResponse, errorResponse, serverErrorResponse } from '@/lib/api-response'
import { checkRateLimit, getRateLimitKey } from '@/lib/auth/rate-limit'
import { prisma } from '@/lib/db/client'
import { sendAdminAlertEmail } from '@/lib/email/service'
import { containsBlockedContent, BLOCKED_MESSAGE } from '@/modules/prayer-wall/utils/content-safety'

// POST /api/v1/prayer-wall/submit
// Anonymous submissions are allowed by design -- privacy defaults to
// "private" unless the submitter explicitly chose otherwise, matching the
// SubmitPrayerForm UI, which defaults to Private and requires an active
// choice to make a request more visible.

const SUBMIT_RATE = { limit: 10, windowMs: 60 * 60 * 1000 } // 10/hour per IP
const VALID_CATEGORIES = ['healing','family','relationships','work','financial','salvation','mental-health','grief','gratitude','ministry','other']
const VALID_PRIVACY    = ['private','anonymous','community','public']

export const POST = withOptionalAuth(async (req: NextRequest, user) => {
  const ip = req.headers.get('x-forwarded-for') ?? 'unknown'
  const { allowed } = checkRateLimit(getRateLimitKey('prayer-submit', ip), SUBMIT_RATE)
  if (!allowed) return errorResponse('RATE_LIMITED', 'Too many submissions. Please try again later.', 429)

  try {
    const contentType = req.headers.get('content-type') ?? ''
    let title: string, content: string, category: string, privacy: string, display_name: string | null

    if (contentType.includes('multipart/form-data')) {
      const form = await req.formData()
      title        = String(form.get('title') ?? '')
      content      = String(form.get('content') ?? '')
      category     = String(form.get('category') ?? 'other')
      privacy      = String(form.get('privacy') ?? 'private')
      display_name = form.get('display_name') ? String(form.get('display_name')) : null
      // Note: actual file upload storage (S3/Vercel Blob) is not wired up
      // yet -- attachment_url stays null until a storage provider is
      // configured. Flagged rather than silently dropped.
    } else {
      const body = await req.json()
      title        = String(body.title ?? '')
      content      = String(body.content ?? '')
      category     = String(body.category ?? 'other')
      privacy      = String(body.privacy ?? 'private')
      display_name = body.display_name ? String(body.display_name) : null
    }

    if (!title.trim() || !content.trim()) {
      return errorResponse('MISSING_FIELDS', 'Please provide a title and prayer request.', 400)
    }
    if (content.trim().length < 20) {
      return errorResponse('CONTENT_TOO_SHORT', 'Please write at least 20 characters for your prayer request.', 400)
    }
    // Server-side safety check -- cannot be bypassed by disabling client JS.
    // Same shared regex rules as the client form (src/modules/prayer-wall/utils/content-safety.ts).
    if (containsBlockedContent(title) || containsBlockedContent(content)) {
      return errorResponse('UNSAFE_CONTENT', BLOCKED_MESSAGE, 400)
    }
    if (!VALID_CATEGORIES.includes(category)) category = 'other'
    if (!VALID_PRIVACY.includes(privacy)) privacy = 'private'

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const created = await (prisma as any).prayerRequest.create({
      data: {
        user_id:      user?.id ?? null,
        title:        title.trim(),
        content:      content.trim(),
        category,
        privacy,
        moderation_status: 'pending',
        display_name: privacy === 'anonymous' || privacy === 'private' ? null : display_name,
      },
      select: { id: true },
    })

    ;(async () => {
      const admins = await (prisma as any).user.findMany({ where: { role: { in: ['admin', 'super_admin'] } }, select: { email: true } })
      const preview = title.trim().slice(0, 100)
      for (const admin of admins) {
        sendAdminAlertEmail(admin.email, preview).catch(err => console.error('[PrayerWall] Admin alert email failed:', err))
      }
    })()

    return createdResponse({ id: created.id }, 'Prayer request submitted.')
  } catch (error) {
    console.error('[PrayerWall] Submit error:', error)
    return serverErrorResponse()
  }
})