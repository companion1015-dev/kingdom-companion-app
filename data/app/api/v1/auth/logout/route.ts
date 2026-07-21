// POST /api/v1/auth/logout
import { NextRequest, NextResponse } from 'next/server'
import { revokeSession, logAuthEvent } from '@/lib/auth/service'
import { successResponse, serverErrorResponse } from '@/lib/api-response'

export async function POST(req: NextRequest) {
  const ip           = req.headers.get('x-forwarded-for') ?? 'unknown'
  const refreshToken = req.cookies.get('refresh_token')?.value

  try {
    if (refreshToken) {
      await revokeSession(refreshToken)
    }

    await logAuthEvent('LOGOUT', undefined, ip)

    const response = successResponse(null, 'Signed out successfully.')
    response.cookies.delete('access_token')
    response.cookies.delete('refresh_token')
    return response

  } catch (error) {
    console.error('[Logout]', error)
    // Always succeed on logout — clear cookies regardless
    const response = NextResponse.json({ success: true, data: null, message: 'Signed out.' })
    response.cookies.delete('access_token')
    response.cookies.delete('refresh_token')
    return response
  }
}
