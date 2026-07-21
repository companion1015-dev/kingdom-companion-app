import { NextRequest } from 'next/server'
import { successResponse, errorResponse, serverErrorResponse } from '@/lib/api-response'
import { isValidReferralCode, hashIp, REFERRAL_LIMITS } from '@/modules/referrals/services/referral-service'
import { checkRateLimit, getRateLimitKey } from '@/lib/auth/rate-limit'
import { prisma } from '@/lib/db/client'
import type { ShareSource } from '@/modules/referrals/types'

// Rate limit: 5 tracking events per minute per IP (abuse prevention)
const TRACK_RATE = { limit: 5, windowMs: 60 * 1000 }

export async function POST(req: NextRequest) {
  const ip     = req.headers.get('x-forwarded-for') ?? req.headers.get('x-real-ip') ?? 'unknown'
  const rateKey = getRateLimitKey('referral-track', ip)
  const { allowed } = checkRateLimit(rateKey, TRACK_RATE)
  if (!allowed) {
    // Silent success — don't reveal rate limiting to potential abusers
    return successResponse(null, 'Tracked.')
  }

  try {
    const body = await req.json()
    const { code, event, source, referred_user_id } = body as {
      code:              string
      event:             'click' | 'registered' | 'verified'
      source?:           ShareSource
      referred_user_id?: string
    }

    // Validate code format
    if (!code || !isValidReferralCode(code)) {
      return errorResponse('INVALID_CODE', 'Invalid referral code.', 400)
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = prisma as any

    // Find the referral code record
    let codeRecord = null
    try {
      const results = await db.referralCode?.findMany?.({ where: { code }, take: 1 })
      codeRecord    = results?.[0] ?? null
    } catch {
      // Table doesn't exist — track in memory only
      return successResponse({ tracked: true, demo: true }, 'Tracked (demo mode).')
    }

    if (!codeRecord) {
      return successResponse(null, 'Code not found — tracked silently.')
    }

    const ipHash = hashIp(ip)

    // ─── ABUSE PREVENTION ────────────────────────────────────────────────────

    // 1. Prevent self-referral — user cannot use their own code
    if (referred_user_id && codeRecord.user_id === referred_user_id) {
      return successResponse(null, 'Self-referral prevented.')
    }

    // 2. Prevent duplicate registration — one referral per user account
    if (referred_user_id && event === 'registered') {
      try {
        const existing = await db.referral?.findMany?.({
          where: { referred_user_id, status: 'registered' },
          take:  1,
        })
        if (existing?.length > 0) {
          return successResponse(null, 'Duplicate referral prevented.')
        }
      } catch { /* table may not exist */ }
    }

    // 3. Detect excessive click activity from same IP
    if (event === 'click') {
      try {
        const recentClicks = await db.referral?.findMany?.({
          where: {
            referral_code_id: codeRecord.id,
            ip_fingerprint:   ipHash,
            status:           'clicked',
            created_at:       { gte: new Date(Date.now() - 60 * 60 * 1000) },
          },
        })
        if ((recentClicks?.length ?? 0) >= REFERRAL_LIMITS.MAX_CLICKS_PER_HOUR_PER_IP) {
          return successResponse(null, 'Excessive activity detected — tracked silently.')
        }
      } catch { /* continue */ }
    }

    // ─── RECORD EVENT ─────────────────────────────────────────────────────────

    if (event === 'click') {
      // Increment click counter on the code
      await db.referralCode?.update?.({
        where: { id: codeRecord.id },
        data:  { clicks: (codeRecord.clicks ?? 0) + 1 },
      })

      // Create a referral record for this click
      try {
        await db.referral?.create?.({
          data: {
            referral_code_id: codeRecord.id,
            status:           'clicked',
            ip_fingerprint:   ipHash,
            source:           source ?? null,
          },
        })
      } catch { /* continue */ }

    } else if (event === 'registered' && referred_user_id) {
      // Update the most recent 'clicked' referral from this IP to 'registered'
      try {
        const clickedReferral = await db.referral?.findMany?.({
          where: {
            referral_code_id: codeRecord.id,
            ip_fingerprint:   ipHash,
            status:           'clicked',
          },
          orderBy: { created_at: 'desc' },
          take:    1,
        })

        if (clickedReferral?.[0]) {
          await db.referral?.update?.({
            where: { id: clickedReferral[0].id },
            data:  { referred_user_id, status: 'registered' },
          })
        } else {
          // Create new referral record if no click record found
          await db.referral?.create?.({
            data: {
              referral_code_id: codeRecord.id,
              referred_user_id,
              status:           'registered',
              ip_fingerprint:   ipHash,
              source:           source ?? null,
            },
          })
        }
      } catch (e) {
        console.error('[Referrals] Registration tracking error:', e)
      }

    } else if (event === 'verified' && referred_user_id) {
      // Mark referral as fully verified (complete)
      try {
        await db.referral?.updateMany?.({
          where: { referred_user_id, status: 'registered' },
          data:  { status: 'verified', verified_at: new Date() },
        })
      } catch (e) {
        console.error('[Referrals] Verification tracking error:', e)
      }
    }

    return successResponse({ tracked: true, event }, 'Event tracked successfully.')

  } catch (error) {
    console.error('[Referrals] Track error:', error)
    return serverErrorResponse()
  }
}
