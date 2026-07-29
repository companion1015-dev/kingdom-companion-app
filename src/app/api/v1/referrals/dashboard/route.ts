import { NextRequest } from 'next/server'
import { withAuth } from '@/lib/auth/middleware'
import { successResponse, serverErrorResponse } from '@/lib/api-response'
import { prisma } from '@/lib/db/client'
import { generateReferralCode } from '@/modules/referrals/services/referral-service'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://kingdomcompanion.app'

// Real fix: this previously returned link: null whenever a user had never
// had a referral code generated yet -- which was every genuinely new user,
// since nothing auto-generates one on registration. The frontend then
// displayed the literal word "null" as someone's invite link. Now
// generates a real code inline on first visit here, matching "one
// permanent code per user, created when first needed."

export const GET = withAuth(async (_req: NextRequest, user) => {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = prisma as any

    let codeRecord = null
    const results  = await db.referralCode.findMany({ where: { user_id: user.id }, take: 1 })
    codeRecord     = results?.[0] ?? null

    if (!codeRecord) {
      // No code yet -- create one now rather than returning nulls.
      let code = ''
      for (let attempt = 0; attempt < 5; attempt++) {
        code = generateReferralCode()
        try {
          codeRecord = await db.referralCode.create({ data: { user_id: user.id, code, clicks: 0 } })
          break
        } catch (err) {
          if (attempt === 4) throw err // unique constraint collision on every retry -- genuinely fail
        }
      }
    }

    let referrals: Array<{ status: string; source: string | null; created_at: Date }> = []
    try {
      referrals = await db.referral.findMany({
        where:   { referral_code_id: codeRecord.id },
        select:  { status: true, source: true, created_at: true },
        orderBy: { created_at: 'desc' },
      }) ?? []
    } catch { /* continue with empty */ }

    const pending    = referrals.filter(r => r.status === 'registered').length
    const successful = referrals.filter(r => r.status === 'verified').length

    const recent = referrals.slice(0, 10).map(r => ({
      status:     r.status,
      source:     r.source,
      created_at: r.created_at instanceof Date ? r.created_at.toISOString() : String(r.created_at),
    }))

    return successResponse({
      code:          codeRecord.code,
      link:          `${APP_URL}/invite/${codeRecord.code}`,
      clicks:        codeRecord.clicks ?? 0,
      pending,
      successful,
      total_invited: (codeRecord.clicks ?? 0),
      recent,
    }, 'Referral dashboard retrieved.')

  } catch (error) {
    console.error('[Referrals] Dashboard error:', error)
    return serverErrorResponse()
  }
})