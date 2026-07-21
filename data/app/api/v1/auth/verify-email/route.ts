// POST /api/v1/auth/verify-email
import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db/client'
import { consumeVerificationToken, logAuthEvent } from '@/lib/auth/service'
import { sendWelcomeEmail } from '@/lib/email/service'
import { successResponse, errorResponse, serverErrorResponse } from '@/lib/api-response'

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for') ?? 'unknown'

  try {
    const { token } = await req.json()
    if (!token) return errorResponse('MISSING_TOKEN', 'Verification token is required.', 400)

    const userId = await consumeVerificationToken(token, 'email_verification')

    // Mark email as verified
    const user = await prisma.user.update({
      where: { id: userId },
      data:  { email_verified_at: new Date() },
      select: { email: true, display_name: true },
    })

    await logAuthEvent('EMAIL_VERIFIED', userId, ip)

    // Send welcome email now that verification is complete
    await sendWelcomeEmail(user.email as string, user.display_name as string)

    return successResponse(null, 'Email address verified successfully. Welcome to Kingdom Companion!')

  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'TOKEN_NOT_FOUND')    return errorResponse('TOKEN_INVALID', 'Verification link is invalid.', 400)
      if (error.message === 'TOKEN_EXPIRED')      return errorResponse('TOKEN_EXPIRED', 'Verification link has expired. Please request a new one.', 400)
      if (error.message === 'TOKEN_ALREADY_USED') return errorResponse('TOKEN_USED', 'This verification link has already been used.', 400)
    }
    console.error('[VerifyEmail]', error)
    return serverErrorResponse()
  }
}
