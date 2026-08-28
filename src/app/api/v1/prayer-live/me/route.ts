import { withOptionalAuth } from '@/lib/auth/middleware'
import { successResponse } from '@/lib/api-response'
import { isHostRole } from '@/lib/prayer-live/livekit'

/**
 * GET /api/v1/prayer-live/me
 * Lets the client know whether to show host controls at all -- the real
 * enforcement is server-side in start/end (isHostRole check), this just
 * avoids showing "Go live" to every visitor regardless of role.
 */
export const GET = withOptionalAuth(async (_req, user) => {
  return successResponse({ isHost: isHostRole(user?.role) }, 'Host status retrieved.')
})
