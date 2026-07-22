import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db/client'
import { hashPassword, createVerificationToken, logAuthEvent } from '@/lib/auth/service'
import { sendVerificationEmail } from '@/lib/email/service'
import { RegisterSchema } from '@/lib/validation/schemas'
import { checkRateLimit, RATE_LIMITS, getRateLimitKey } from '@/lib/auth/rate-limit'
import {
  createdResponse, errorResponse, validationErrorResponse,
  rateLimitResponse, serverErrorResponse,
} from '@/lib/api-response'
import { ZodError } from 'zod'

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for') ?? req.headers.get('x-real-ip') ?? 'unknown'

  // ─── Rate limiting (ASD §5.27: 10 requests per 15 minutes for auth) ─────────
  const rateKey = getRateLimitKey('register', ip)
  const { allowed, retryAfter } = checkRateLimit(rateKey, RATE_LIMITS.AUTH)
  if (!allowed) {
    await logAuthEvent('REGISTER_RATE_LIMITED', undefined, ip)
    return rateLimitResponse()
  }

  try {
    // ─── Parse & validate ────────────────────────────────────────────────────
    const body = await req.json()
    const validated = RegisterSchema.parse(body)

    // ─── Check email uniqueness ──────────────────────────────────────────────
    const existing = await prisma.user.findUnique({
      where: { email: validated.email },
      select: { id: true, deleted_at: true },
    })

    if (existing && !existing.deleted_at) {
      await logAuthEvent('REGISTER_EMAIL_TAKEN', undefined, ip, { email: validated.email })
      return errorResponse('EMAIL_TAKEN', 'An account with this email address already exists.', 409)
    }

    // ─── Create user ─────────────────────────────────────────────────────────
    const password_hash = await hashPassword(validated.password)

    const user = await prisma.user.create({
      data: {
        display_name:  validated.display_name,
        email:         validated.email,
        password_hash,
        auth_provider: 'email',
        role:          'user',
        account_status:'active',
      },
      select: {
        id:           true,
        email:        true,
        display_name: true,
        created_at:   true,
      },
    })

    // ─── Send verification email ──────────────────────────────────────────────
    const verificationToken = await createVerificationToken(user.id as string, 'email_verification')
    await sendVerificationEmail(user.email as string, user.display_name as string, verificationToken)

    // ─── Audit log ────────────────────────────────────────────────────────────
    await logAuthEvent('REGISTER_SUCCESS', user.id as string, ip)

    return createdResponse(
      { user_id: user.id, email: user.email },
      'Account created successfully. Please check your email to verify your address.',
    )

  } catch (error) {
    if (error instanceof ZodError) return validationErrorResponse(error)
    console.error('[Register]', error)
    return serverErrorResponse()
  }
}
