// POST /api/v1/auth/reset-password
import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db/client'
import { consumeVerificationToken, hashPassword, revokeAllUserSessions, logAuthEvent } from '@/lib/auth/service'
import { ResetPasswordSchema } from '@/lib/validation/schemas'
import { successResponse, errorResponse, validationErrorResponse, serverErrorResponse } from '@/lib/api-response'
import { ZodError } from 'zod'

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for') ?? 'unknown'

  try {
    const body      = await req.json()
    const validated = ResetPasswordSchema.parse(body)

    const userId = await consumeVerificationToken(validated.token, 'password_reset')

    // Update password
    const newHash = await hashPassword(validated.password)
    await prisma.user.update({
      where: { id: userId },
      data:  { password_hash: newHash, updated_at: new Date() },
    })

    // Revoke all existing sessions — forces fresh login everywhere
    await revokeAllUserSessions(userId)

    await logAuthEvent('PASSWORD_RESET_SUCCESS', userId, ip)

    return successResponse(
      null,
      'Password reset successfully. Please sign in with your new password.',
    )

  } catch (error) {
    if (error instanceof ZodError) return validationErrorResponse(error)

    if (error instanceof Error) {
      if (error.message === 'TOKEN_NOT_FOUND')    return errorResponse('TOKEN_INVALID', 'Reset link is invalid.', 400)
      if (error.message === 'TOKEN_EXPIRED')      return errorResponse('TOKEN_EXPIRED', 'Reset link has expired. Please request a new one.', 400)
      if (error.message === 'TOKEN_ALREADY_USED') return errorResponse('TOKEN_USED', 'This reset link has already been used.', 400)
    }
    console.error('[ResetPassword]', error)
    return serverErrorResponse()
  }
}
