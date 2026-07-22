// POST /api/v1/auth/forgot-password
import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db/client'
import { createVerificationToken, logAuthEvent } from '@/lib/auth/service'
import { sendPasswordResetEmail } from '@/lib/email/service'
import { ForgotPasswordSchema } from '@/lib/validation/schemas'
import { checkRateLimit, RATE_LIMITS, getRateLimitKey } from '@/lib/auth/rate-limit'
import { successResponse, validationErrorResponse, rateLimitResponse, serverErrorResponse } from '@/lib/api-response'
import { ZodError } from 'zod'

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for') ?? 'unknown'

  // Stricter rate limit for password reset — ASD §5.27: 5/hour
  const rateKey = getRateLimitKey('forgot-password', ip)
  const { allowed } = checkRateLimit(rateKey, RATE_LIMITS.RESET)
  if (!allowed) return rateLimitResponse()

  try {
    const body      = await req.json()
    const validated = ForgotPasswordSchema.parse(body)

    // Always return success — never reveal whether email exists (security)
    const successMsg = 'If an account exists with this email, a password reset link has been sent.'

    const user = await prisma.user.findUnique({
      where: { email: validated.email, deleted_at: null },
      select: { id: true, email: true, display_name: true, auth_provider: true },
    })

    if (!user) {
      await logAuthEvent('PASSWORD_RESET_EMAIL_NOT_FOUND', undefined, ip, { email: validated.email })
      return successResponse(null, successMsg)
    }

    if (user.auth_provider !== 'email') {
      // OAuth user — silently return success without sending email
      return successResponse(null, successMsg)
    }

    const resetToken = await createVerificationToken(user.id as string, 'password_reset')
    await sendPasswordResetEmail(user.email as string, user.display_name as string, resetToken)
    await logAuthEvent('PASSWORD_RESET_SENT', user.id as string, ip)

    return successResponse(null, successMsg)

  } catch (error) {
    if (error instanceof ZodError) return validationErrorResponse(error)
    console.error('[ForgotPassword]', error)
    return serverErrorResponse()
  }
}
