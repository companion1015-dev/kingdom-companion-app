import { NextRequest } from 'next/server'
import { withAuth } from '@/lib/auth/middleware'
import { successResponse, serverErrorResponse } from '@/lib/api-response'
import { generateReferralCode } from '@/modules/referrals/services/referral-service'
import { prisma } from '@/lib/db/client'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://kingdomcompanion.app'

// POST /api/v1/referrals/generate
// Creates referral code for authenticated user (or returns existing one)
// One permanent code per user — never regenerated
export const POST = withAuth(async (_req: NextRequest, user) => {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = prisma as any

    // Check if user already has a referral code
    let record = null
    try {
      const results = await db.referralCode?.findMany?.({
        where: { user_id: user.id },
        take:  1,
      })
      record = results?.[0] ?? null
    } catch {
      // Table doesn't exist yet — return demo response
      const demoCode = generateReferralCode()
      return successResponse({
        code:       demoCode,
        link:       `${APP_URL}/invite/${demoCode}`,
        clicks:     0,
        demo_mode:  true,
        message:    'Add referral_code table to database to enable persistent codes.',
      }, 'Referral code generated (demo mode).')
    }

    if (record) {
      // Return existing code
      return successResponse({
        code:   record.code,
        link:   `${APP_URL}/invite/${record.code}`,
        clicks: record.clicks ?? 0,
      }, 'Referral code retrieved.')
    }

    // Generate new unique code (retry up to 5 times on collision)
    let code    = ''
    let created = null
    for (let attempt = 0; attempt < 5; attempt++) {
      code = generateReferralCode()
      try {
        created = await db.referralCode?.create?.({
          data: { user_id: user.id, code, clicks: 0 },
        })
        break
      } catch (err) {
        // Unique constraint violation — try again
        if (attempt === 4) throw err
      }
    }

    return successResponse({
      code:   code,
      link:   `${APP_URL}/invite/${code}`,
      clicks: 0,
    }, 'Referral code generated successfully.')

  } catch (error) {
    console.error('[Referrals] Generate error:', error)
    return serverErrorResponse()
  }
})

// GET /api/v1/referrals/generate — same as POST (idempotent fetch)
export const GET = POST
