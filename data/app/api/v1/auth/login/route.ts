import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/client'
import { verifyPassword, createSession, logAuthEvent } from '@/lib/auth/service'
import { LoginSchema } from '@/lib/validation/schemas'
import { checkRateLimit, RATE_LIMITS, getRateLimitKey } from '@/lib/auth/rate-limit'
import {
  errorResponse, validationErrorResponse,
  rateLimitResponse, serverErrorResponse,
} from '@/lib/api-response'
import { ZodError } from 'zod'

// Cookie configuration — Architecture Spec §4.1: HTTP-only, no localStorage
const COOKIE_OPTIONS = {
  httpOnly: true,
  secure:   process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path:     '/',
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for') ?? req.headers.get('x-real-ip') ?? 'unknown'

  // ─── Rate limiting ────────────────────────────────────────────────────────
  const rateKey = getRateLimitKey('login', ip)
  const { allowed } = checkRateLimit(rateKey, RATE_LIMITS.AUTH)
  if (!allowed) {
    await logAuthEvent('LOGIN_RATE_LIMITED', undefined, ip)
    return rateLimitResponse()
  }

  try {
    const body      = await req.json()
    const validated = LoginSchema.parse(body)

    // ─── Find user ───────────────────────────────────────────────────────────
    const user = await prisma.user.findUnique({
      where: { email: validated.email, deleted_at: null },
      select: {
        id:                true,
        email:             true,
        display_name:      true,
        password_hash:     true,
        email_verified_at: true,
        account_status:    true,
        role:              true,
        preferred_translation: true,
        theme:             true,
      },
    })

    // Generic error — never reveal whether email exists
    const invalidCredentials = () =>
      errorResponse('INVALID_CREDENTIALS', 'Email or password is incorrect.', 401)

    if (!user) {
      await logAuthEvent('LOGIN_USER_NOT_FOUND', undefined, ip, { email: validated.email })
      return invalidCredentials()
    }

    if (user.account_status === 'suspended') {
      await logAuthEvent('LOGIN_ACCOUNT_SUSPENDED', user.id, ip)
      return errorResponse('ACCOUNT_SUSPENDED', 'Your account has been suspended. Please contact support.', 403)
    }

    // ─── Verify password ─────────────────────────────────────────────────────
    if (!user.password_hash) {
      // Account created via OAuth — must use OAuth to sign in
      return errorResponse('USE_OAUTH', 'This account uses Google or Apple sign-in. Please use that method.', 400)
    }

    const passwordValid = await verifyPassword(validated.password, user.password_hash)
    if (!passwordValid) {
      await logAuthEvent('LOGIN_WRONG_PASSWORD', user.id, ip)
      return invalidCredentials()
    }

    // ─── Create session ───────────────────────────────────────────────────────
    const deviceInfo = req.headers.get('user-agent') ?? undefined
    const { accessToken, refreshToken } = await createSession(user.id as string, deviceInfo, ip)

    // ─── Update last login ────────────────────────────────────────────────────
    await prisma.user.update({
      where: { id: user.id },
      data:  { last_login_at: new Date() },
    })

    // ─── Audit log ────────────────────────────────────────────────────────────
    await logAuthEvent('LOGIN_SUCCESS', user.id, ip)

    // ─── Set HTTP-only cookies (Architecture Spec §4.1 — no localStorage) ────
    const response = NextResponse.json({
      success: true,
      data: {
        user: {
          id:                   user.id,
          email:                user.email,
          display_name:         user.display_name,
          role:                 user.role,
          email_verified:       !!user.email_verified_at,
          preferred_translation:user.preferred_translation,
          theme:                user.theme,
        },
        access_token: accessToken, // Also returned for SPA usage
      },
      message: 'Signed in successfully.',
    }, { status: 200 })

    // HTTP-only cookies for maximum security
    response.cookies.set('access_token',  accessToken,  { ...COOKIE_OPTIONS, maxAge: 15 * 60 })
    response.cookies.set('refresh_token', refreshToken, { ...COOKIE_OPTIONS, maxAge: 30 * 24 * 60 * 60 })

    return response

  } catch (error) {
    if (error instanceof ZodError) return validationErrorResponse(error)
    console.error('[Login]', error)
    return serverErrorResponse()
  }
}
