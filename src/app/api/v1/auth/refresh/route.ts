// POST /api/v1/auth/refresh
import { NextRequest, NextResponse } from 'next/server'
import { rotateRefreshToken, logAuthEvent } from '@/lib/auth/service'
import { unauthorizedResponse, serverErrorResponse } from '@/lib/api-response'

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure:   process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path:     '/',
}

export async function POST(req: NextRequest) {
  const ip           = req.headers.get('x-forwarded-for') ?? 'unknown'
  const refreshToken = req.cookies.get('refresh_token')?.value

  if (!refreshToken) return unauthorizedResponse('No refresh token provided.')

  try {
    const { accessToken, refreshToken: newRefreshToken } =
      await rotateRefreshToken(refreshToken, ip)

    const response = NextResponse.json({
      success: true,
      data:    { access_token: accessToken },
      message: 'Token refreshed.',
    })

    response.cookies.set('access_token',  accessToken,     { ...COOKIE_OPTIONS, maxAge: 15 * 60 })
    response.cookies.set('refresh_token', newRefreshToken, { ...COOKIE_OPTIONS, maxAge: 30 * 24 * 60 * 60 })

    return response

  } catch (error) {
    await logAuthEvent('REFRESH_FAILED', undefined, ip)

    if (error instanceof Error) {
      if (error.message === 'INVALID_REFRESH_TOKEN') return unauthorizedResponse('Session expired. Please sign in again.')
      if (error.message === 'ACCOUNT_SUSPENDED')     return unauthorizedResponse('Account suspended.')
    }

    return serverErrorResponse()
  }
}
