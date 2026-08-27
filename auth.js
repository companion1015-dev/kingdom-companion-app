/**
 * Stand-in for Kingdom Companion's existing session/auth middleware.
 *
 * Per the blueprint (Section 2 & 3): watching never requires an account,
 * but participating (chat, requests, going on camera) does. This module
 * verifies the app's own session token/cookie and resolves it to a user
 * record with a role. Swap the body of `resolveSession` for a call into
 * your real auth system (session cookie lookup, JWT verify, etc.) —
 * nothing else in this service needs to change.
 *
 * IMPORTANT: role must never be trusted from the client request body.
 * It is resolved server-side from the authenticated session, then used
 * to decide what LiveKit grant the participant gets.
 */

// Roles from blueprint Section 3.
const ROLES = Object.freeze({
  VISITOR: 'visitor', // not signed in — watch only, handled before this module even runs
  MEMBER: 'member',
  PRAYER_PARTNER: 'prayer_partner',
  INTERCESSOR: 'intercessor',
  WORSHIP_LEADER: 'worship_leader',
  HOST: 'host',
  MODERATOR: 'moderator',
  ADMIN: 'administrator',
  SUPER_ADMIN: 'super_admin',
});

/**
 * @param {import('express').Request} req
 * @returns {Promise<{ userId: string, displayName: string, role: string } | null>}
 *   null means "no valid session" — caller treats them as an unauthenticated Visitor.
 */
async function resolveSession(req) {
  const token = req.headers.authorization?.replace(/^Bearer\s+/i, '');
  if (!token) return null;

  // --- Replace this block with a real lookup against Kingdom Companion's
  // --- user/session store. This mock decodes a base64 JSON blob so the
  // --- rest of the service is exercisable end-to-end in dev/demo mode.
  try {
    const decoded = JSON.parse(Buffer.from(token, 'base64').toString('utf8'));
    if (!decoded.userId || !decoded.role) return null;
    if (!Object.values(ROLES).includes(decoded.role)) return null;
    return {
      userId: decoded.userId,
      displayName: decoded.displayName || 'Believer',
      role: decoded.role,
    };
  } catch {
    return null;
  }
}

/** Roles allowed to start/stop the session and manage the room in real time. */
function isHostRole(role) {
  return role === ROLES.HOST || role === ROLES.ADMIN || role === ROLES.SUPER_ADMIN;
}

/** Roles that may be invited on-stage (audio/video) but cannot start/end the room. */
function isStageEligible(role) {
  return (
    isHostRole(role) ||
    role === ROLES.INTERCESSOR ||
    role === ROLES.WORSHIP_LEADER
  );
}

/** Roles allowed to moderate chat (mute/remove/ban) — separate from stage permissions. */
function isModeratorRole(role) {
  return role === ROLES.MODERATOR || role === ROLES.ADMIN || role === ROLES.SUPER_ADMIN;
}

module.exports = { ROLES, resolveSession, isHostRole, isStageEligible, isModeratorRole };
