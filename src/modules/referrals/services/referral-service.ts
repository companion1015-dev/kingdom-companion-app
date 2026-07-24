// ─── REFERRAL SERVICE ─────────────────────────────────────────────────────────
// Secure referral code generation and validation
// Abuse prevention: no self-referrals, no duplicate accounts, rate limiting

import crypto from 'crypto'

// ─── CODE GENERATION ─────────────────────────────────────────────────────────
// Format: BC-XXXXXXXX (12 chars total)
// - Prefix "BC-" for brand recognition
// - 8 char alphanumeric base32 (no ambiguous chars: 0,O,I,L)
// - ~1.7 trillion combinations — practically unguessable

const SAFE_CHARS = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'  // No 0,O,I,L,1

export function generateReferralCode(): string {
  const bytes  = crypto.randomBytes(8)
  let   result = 'KC-'
  for (let i = 0; i < 8; i++) {
    result += SAFE_CHARS[bytes[i] % SAFE_CHARS.length]
  }
  return result
}

// ─── IP FINGERPRINTING ────────────────────────────────────────────────────────
// Hash IP for abuse detection — never store raw IP for privacy
export function hashIp(ip: string): string {
  return crypto
    .createHmac('sha256', process.env.JWT_SECRET ?? 'bc-referral-salt')
    .update(ip)
    .digest('hex')
    .slice(0, 16)  // Use only first 16 chars
}

// ─── ABUSE PREVENTION RULES ───────────────────────────────────────────────────

export const REFERRAL_LIMITS = {
  MAX_CLICKS_PER_HOUR_PER_IP: 5,      // Same IP can only "click" 5 referral links per hour
  MAX_CODES_PER_USER:          1,      // One code per user (permanent)
  MIN_ACCOUNT_AGE_HOURS:       0,      // No minimum — generate on registration
  MAX_PENDING_PER_CODE:        1000,   // Safety cap on pending referrals per code
}

// ─── VALIDATION HELPERS ───────────────────────────────────────────────────────

export function isValidReferralCode(code: string): boolean {
  // Must match format: KC-XXXXXXXX (11 chars total, only safe chars after prefix)
  return /^KC-[ABCDEFGHJKMNPQRSTUVWXYZ23456789]{8}$/.test(code)
}

// Parse referral code from URL (handles both /invite/BC-XXXX and ?ref=BC-XXXX)
export function extractReferralCode(url: string): string | null {
  // From path: /invite/BC-XXXXXXXX
  const pathMatch = url.match(/\/invite\/([A-Z0-9-]{11})/)
  if (pathMatch) return pathMatch[1]

  // From query: ?ref=BC-XXXXXXXX
  try {
    const params = new URL(url).searchParams
    const ref    = params.get('ref')
    if (ref && isValidReferralCode(ref)) return ref
  } catch { /* ignore */ }

  return null
}

// Store referral code in session for attribution during registration
const REFERRAL_SESSION_KEY = 'bc_pending_referral'

export function storeReferralForSession(code: string): void {
  if (typeof sessionStorage === 'undefined') return
  if (!isValidReferralCode(code)) return
  sessionStorage.setItem(REFERRAL_SESSION_KEY, JSON.stringify({
    code,
    stored_at: Date.now(),
  }))
}

export function getPendingReferral(): { code: string; stored_at: number } | null {
  if (typeof sessionStorage === 'undefined') return null
  try {
    const raw  = sessionStorage.getItem(REFERRAL_SESSION_KEY)
    if (!raw) return null
    const data = JSON.parse(raw)
    // Expire after 7 days
    if (Date.now() - data.stored_at > 7 * 24 * 60 * 60 * 1000) {
      sessionStorage.removeItem(REFERRAL_SESSION_KEY)
      return null
    }
    return data
  } catch { return null }
}

export function clearPendingReferral(): void {
  if (typeof sessionStorage !== 'undefined') {
    sessionStorage.removeItem(REFERRAL_SESSION_KEY)
  }
}