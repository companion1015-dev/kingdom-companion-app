import { NextRequest } from 'next/server'
import { withAuth } from '@/lib/auth/middleware'
import { successResponse, serverErrorResponse } from '@/lib/api-response'
import { prisma } from '@/lib/db/client'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://kingdomcompanion.app'

export const GET = withAuth(async (_req: NextRequest, user) => {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = prisma as any

    // Get user's referral code
    let codeRecord = null
    try {
      const results  = await db.referralCode?.findMany?.({ where: { user_id: user.id }, take: 1 })
      codeRecord     = results?.[0] ?? null
    } catch {
      // Tables don't exist yet — return empty dashboard
      return successResponse({
        code:          null,
        link:          null,
        clicks:        0,
        pending:       0,
        successful:    0,
        total_invited: 0,
        recent:        [],
        demo_mode:     true,
      }, 'Dashboard (demo mode — run database migrations to enable).')
    }

    if (!codeRecord) {
      // No code yet — return empty state
      return successResponse({
        code:          null,
        link:          null,
        clicks:        0,
        pending:       0,
        successful:    0,
        total_invited: 0,
        recent:        [],
      }, 'No referral code yet. Generate one to start inviting.')
    }

    // Get referral stats — anonymous, no personal data about referred users
    let referrals: Array<{ status: string; source: string | null; created_at: Date }> = []
    try {
      referrals = await db.referral?.findMany?.({
        where:   { referral_code_id: codeRecord.id },
        select:  { status: true, source: true, created_at: true },
        orderBy: { created_at: 'desc' },
      }) ?? []
    } catch { /* continue with empty */ }

    const pending    = referrals.filter(r => r.status === 'registered').length
    const successful = referrals.filter(r => r.status === 'verified').length

    // Recent activity — anonymous status only, no PII
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
