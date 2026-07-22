import { NextRequest } from 'next/server'
import { withAdmin } from '@/lib/auth/middleware'
import { successResponse, serverErrorResponse } from '@/lib/api-response'
import { prisma } from '@/lib/db/client'
import type { ReferralAnalytics } from '@/modules/referrals/types'

export const GET = withAdmin(async (_req: NextRequest) => {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = prisma as any

    let codes:     { clicks: number; created_at: Date }[]                           = []
    let referrals: { status: string; source: string | null; created_at: Date }[]    = []

    try {
      codes     = await db.referralCode?.findMany?.({ select: { clicks: true, created_at: true } }) ?? []
      referrals = await db.referral?.findMany?.({ select: { status: true, source: true, created_at: true } }) ?? []
    } catch {
      return successResponse({
        total_codes_generated: 0, total_clicks: 0, total_registered: 0,
        total_verified: 0, click_through_rate: 0, conversion_rate: 0,
        top_sources: [], by_month: [], demo_mode: true,
      }, 'Analytics (demo mode — run migrations to enable).')
    }

    const totalClicks      = codes.reduce((sum, c) => sum + (c.clicks ?? 0), 0)
    const totalRegistered  = referrals.filter(r => r.status === 'registered' || r.status === 'verified').length
    const totalVerified    = referrals.filter(r => r.status === 'verified').length
    const ctr              = totalClicks     > 0 ? totalRegistered / totalClicks     : 0
    const convRate         = totalRegistered > 0 ? totalVerified   / totalRegistered : 0

    // Top sources
    const sourceCounts: Record<string, number> = {}
    referrals.forEach(r => {
      const src = r.source ?? 'unknown'
      sourceCounts[src] = (sourceCounts[src] ?? 0) + 1
    })
    const topSources = Object.entries(sourceCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 8)
      .map(([source, count]) => ({ source, count }))

    // By month (last 12 months)
    const now    = new Date()
    const byMonth: ReferralAnalytics['by_month'] = []
    for (let i = 11; i >= 0; i--) {
      const start  = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const end    = new Date(now.getFullYear(), now.getMonth() - i + 1, 1)
      const month  = start.toLocaleString('default', { month: 'short', year: 'numeric' })

      const monthRefs = referrals.filter(r => {
        const d = new Date(r.created_at)
        return d >= start && d < end
      })
      const monthClicks = codes.filter(c => {
        const d = new Date(c.created_at)
        return d >= start && d < end
      }).reduce((sum, c) => sum + (c.clicks ?? 0), 0)

      byMonth.push({
        month,
        clicks:     monthClicks,
        registered: monthRefs.filter(r => r.status === 'registered' || r.status === 'verified').length,
        verified:   monthRefs.filter(r => r.status === 'verified').length,
      })
    }

    const analytics: ReferralAnalytics = {
      total_codes_generated: codes.length,
      total_clicks:          totalClicks,
      total_registered:      totalRegistered,
      total_verified:        totalVerified,
      click_through_rate:    Math.round(ctr * 100) / 100,
      conversion_rate:       Math.round(convRate * 100) / 100,
      top_sources:           topSources,
      by_month:              byMonth,
    }

    return successResponse(analytics, 'Referral analytics retrieved.')
  } catch (error) {
    console.error('[Referrals] Admin analytics error:', error)
    return serverErrorResponse()
  }
})
