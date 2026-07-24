// ─── RATE LIMITER ─────────────────────────────────────────────────────────────
// Constitution §10: Rate limiting is mandatory
// ASD §5.27: Rate limiting per endpoint category
// Development: in-memory Map. Production: replace with Upstash Redis.

type RateLimitEntry = { count: number; resetAt: number }
const store = new Map<string, RateLimitEntry>()

export type RateLimitConfig = {
  limit:    number // max requests
  windowMs: number // time window in milliseconds
}

// ASD §5.27 rate limit tiers
export const RATE_LIMITS = {
  AUTH:    { limit: 10,  windowMs: 15 * 60 * 1000 },  // 10/15min
  RESET:   { limit: 5,   windowMs: 60 * 60 * 1000 },  // 5/hour
  AI:      { limit: 30,  windowMs: 60 * 60 * 1000 },  // 30/hour
  BIBLE:   { limit: 500, windowMs: 60 * 60 * 1000 },  // 500/hour
  GENERAL: { limit: 200, windowMs: 60 * 60 * 1000 },  // 200/hour
  ADMIN:   { limit: 1000,windowMs: 60 * 60 * 1000 },  // 1000/hour
} satisfies Record<string, RateLimitConfig>

export type RateLimitResult = {
  allowed:    boolean
  remaining:  number
  resetAt:    number
  retryAfter: number
}

export function checkRateLimit(
  key:    string,
  config: RateLimitConfig,
): RateLimitResult {
  const now = Date.now()
  const entry = store.get(key)

  if (!entry || entry.resetAt <= now) {
    // New window
    const resetAt = now + config.windowMs
    store.set(key, { count: 1, resetAt })
    return { allowed: true, remaining: config.limit - 1, resetAt, retryAfter: 0 }
  }

  if (entry.count >= config.limit) {
    return {
      allowed:    false,
      remaining:  0,
      resetAt:    entry.resetAt,
      retryAfter: Math.ceil((entry.resetAt - now) / 1000),
    }
  }

  entry.count++
  return {
    allowed:   true,
    remaining: config.limit - entry.count,
    resetAt:   entry.resetAt,
    retryAfter: 0,
  }
}

export function getRateLimitKey(prefix: string, identifier: string): string {
  return `${prefix}:${identifier}`
}

// Cleanup expired entries (called periodically to prevent memory leak)
export function cleanupRateLimits(): void {
  const now = Date.now()
  Array.from(store.entries()).forEach(([key, entry]) => {
    if (entry.resetAt <= now) store.delete(key)
  })
}

// Auto-cleanup every 10 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(cleanupRateLimits, 10 * 60 * 1000)
}