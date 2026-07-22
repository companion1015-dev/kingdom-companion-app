import { withAdmin } from '@/lib/auth/middleware'
import { successResponse, serverErrorResponse } from '@/lib/api-response'
import { prisma } from '@/lib/db/client'
import type { DonationSummary } from '@/modules/donations/types'

export const GET = withAdmin(async () => {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = prisma as any

    // Check if donation table exists (may not in dev without migrations)
    let records: Array<{ amount_cents: number; currency: string; status: string; created_at: Date }> = []
    try {
      records = await db.donationRecord?.findMany?.({
        where:   { status: 'succeeded' },
        orderBy: { created_at: 'desc' },
        select:  { amount_cents: true, currency: true, status: true, created_at: true },
      }) ?? []
    } catch {
      // Table doesn't exist yet — return empty summary
    }

    const succeeded = records.filter(r => r.status === 'succeeded')
    const total     = succeeded.reduce((sum, r) => sum + (r.amount_cents ?? 0), 0)
    const count     = succeeded.length
    const average   = count > 0 ? Math.round(total / count) : 0

    // This month
    const now      = new Date()
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    const thisMonth  = succeeded.filter(r => new Date(r.created_at) >= monthStart)
    const thisMonthTotal = thisMonth.reduce((sum, r) => sum + (r.amount_cents ?? 0), 0)

    // By month (last 12 months)
    const byMonth: DonationSummary['by_month'] = []
    for (let i = 11; i >= 0; i--) {
      const d     = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const end   = new Date(now.getFullYear(), now.getMonth() - i + 1, 1)
      const month = d.toLocaleString('default', { month: 'short', year: 'numeric' })
      const inMonth = succeeded.filter(r => {
        const date = new Date(r.created_at)
        return date >= d && date < end
      })
      byMonth.push({
        month,
        amount_cents: inMonth.reduce((sum, r) => sum + (r.amount_cents ?? 0), 0),
        count:        inMonth.length,
      })
    }

    const summary: DonationSummary = {
      total_amount_cents:   total,
      total_count:          count,
      average_amount_cents: average,
      this_month_cents:     thisMonthTotal,
      this_month_count:     thisMonth.length,
      by_month:             byMonth,
      // Recent: no personal data, amount and status only
      recent: succeeded.slice(0, 10).map(r => ({
        amount_cents: r.amount_cents,
        currency:     r.currency,
        status:       r.status,
        created_at:   r.created_at instanceof Date ? r.created_at.toISOString() : String(r.created_at),
      })),
    }

    return successResponse(summary, 'Donation summary retrieved.')
  } catch (error) {
    console.error('[Donations] Summary error:', error)
    return serverErrorResponse()
  }
})
