import { NextRequest } from 'next/server'
import { verifyAccessToken } from '@/lib/auth/service'
import { unauthorizedResponse, forbiddenResponse } from '@/lib/api-response'
import { prisma } from '@/lib/db/client'

// ─── AUTHENTICATED USER TYPE ──────────────────────────────────────────────────

export type AuthUser = {
  id:    string
  email: string
  role:  string
}

// ─── AUTH MIDDLEWARE ──────────────────────────────────────────────────────────

export type WithAuthHandler = (
  req: NextRequest,
  user: AuthUser,
  context?: { params: Record<string, string> },
) => Promise<Response>

/**
 * Wraps an API route handler with authentication.
 * Verifies JWT from Authorization header or cookie.
 * Constitution §10: Secure authentication required.
 */
export function withAuth(handler: WithAuthHandler) {
  return async (req: NextRequest, context?: { params: Record<string, string> }) => {
    try {
      // Extract token from Authorization header
      const authHeader = req.headers.get('authorization')
      const cookieToken = req.cookies.get('access_token')?.value

      const token = authHeader?.startsWith('Bearer ')
        ? authHeader.slice(7)
        : cookieToken

      if (!token) {
        return unauthorizedResponse('Authentication required.')
      }

      // Verify token
      const payload = verifyAccessToken(token)

      if (payload.type !== 'access') {
        return unauthorizedResponse('Invalid token type.')
      }

      // Verify user still exists and is active
      const user = await prisma.user.findUnique({
        where: { id: payload.sub, deleted_at: null },
        select: { id: true, email: true, role: true, account_status: true },
      })

      if (!user || user.account_status !== 'active') {
        return unauthorizedResponse('Account not found or suspended.')
      }

      return handler(req, { id: user.id as string, email: user.email as string, role: user.role as string }, context)

    } catch (error) {
      if (error instanceof Error && error.name === 'JsonWebTokenError') {
        return unauthorizedResponse('Invalid authentication token.')
      }
      if (error instanceof Error && error.name === 'TokenExpiredError') {
        return unauthorizedResponse('Authentication token has expired.')
      }
      return unauthorizedResponse('Authentication failed.')
    }
  }
}

/**
 * Wraps a route handler requiring admin role.
 * Architecture Spec §5.4: MFA mandatory for admin, session enforced.
 */
export function withAdmin(handler: WithAuthHandler) {
  return withAuth(async (req, user, context) => {
    if (user.role !== 'admin' && user.role !== 'super_admin') {
      return forbiddenResponse('Administrator access required.')
    }
    return handler(req, user, context)
  })
}

/**
 * Wraps a route handler — auth is optional.
 * Used for AI companion (guests allowed) and Bible endpoints.
 */
export type WithOptionalAuthHandler = (
  req: NextRequest,
  user: AuthUser | null,
  context?: { params: Record<string, string> },
) => Promise<Response>

export function withOptionalAuth(handler: WithOptionalAuthHandler) {
  return async (req: NextRequest, context?: { params: Record<string, string> }) => {
    try {
      const authHeader = req.headers.get('authorization')
      const cookieToken = req.cookies.get('access_token')?.value
      const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : cookieToken

      if (!token) return handler(req, null, context)

      const payload = verifyAccessToken(token)
      const user = await prisma.user.findUnique({
        where: { id: payload.sub, deleted_at: null },
        select: { id: true, email: true, role: true, account_status: true },
      })

      if (!user || user.account_status !== 'active') {
        return handler(req, null, context)
      }

      return handler(req, { id: user.id as string, email: user.email as string, role: user.role as string }, context)
    } catch {
      return handler(req, null, context)
    }
  }
}