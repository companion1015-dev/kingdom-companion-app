import { NextRequest } from 'next/server'
import { ZodError } from 'zod'
import { withAuth } from '@/lib/auth/middleware'
import { hashPassword, verifyPassword, revokeAllUserSessions, logAuthEvent } from '@/lib/auth/service'
import { ChangePasswordSchema } from '@/lib/validation/schemas'
import { successResponse, errorResponse, validationErrorResponse, serverErrorResponse } from '@/lib/api-response'
import { prisma } from '@/lib/db/client'

// POST /api/v1/user/change-password
// Genuinely new -- the Profile page could edit display name/translation/
// theme/font size, but a signed-in user had no way to change their own
// password short of the forgot-password email flow. Same rules and same
// "revoke every session" behaviour as /api/v1/auth/reset-password, so a
// password change also forces a fresh sign-in everywhere, consistent with
// that existing flow.

export const POST = withAuth(async (req: NextRequest, user) => {
  const ip = req.headers.get('x-forwarded-for') ?? 'unknown'

  try {
    const body = await req.json()
    const validated = ChangePasswordSchema.parse(body)

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const record = await (prisma as any).user.findUnique({
      where: { id: user.id },
      select: { password_hash: true },
    })

    if (!record?.password_hash) {
      return errorResponse('NO_PASSWORD', 'This account signs in via a provider and has no password to change.', 400)
    }

    const matches = await verifyPassword(validated.current_password, record.password_hash)
    if (!matches) return errorResponse('INCORRECT_PASSWORD', 'Current password is incorrect.', 401)

    const newHash = await hashPassword(validated.password)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (prisma as any).user.update({
      where: { id: user.id },
      data:  { password_hash: newHash, updated_at: new Date() },
    })

    await revokeAllUserSessions(user.id)
    await logAuthEvent('PASSWORD_CHANGE_SUCCESS', user.id, ip)

    return successResponse(null, 'Password changed successfully. Please sign in again with your new password.')
  } catch (error) {
    if (error instanceof ZodError) return validationErrorResponse(error)
    console.error('[ChangePassword] Error:', error)
    return serverErrorResponse()
  }
})
