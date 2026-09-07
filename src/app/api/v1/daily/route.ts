import { NextRequest } from 'next/server'
import { successResponse, serverErrorResponse } from '@/lib/api-response'
import { getOrCreateDailyEntry } from '@/modules/daily/services/daily-entry'

// GET /api/v1/daily
// "Today" is keyed off the CLIENT's local calendar date (?local_date=
// YYYY-MM-DD, sent by every UI call site), not the server's UTC clock --
// server-UTC rotation meant the verse only changed at UTC midnight, which
// can be many hours after a user's own day has already started. Falls back
// to server-UTC date when the param is absent (direct API calls, curl, etc).
//
// Entry generation/caching itself lives in daily-entry.ts, shared with
// /api/v1/push/send-daily so the cron-triggered push sender uses exactly
// the same "today's real entry" logic as this route.

function todayKey(): string {
  return new Date().toISOString().slice(0, 10)
}

function isValidDateKey(s: string | null): s is string {
  return !!s && /^\d{4}-\d{2}-\d{2}$/.test(s) && !isNaN(new Date(s).getTime())
}

export async function GET(req: NextRequest) {
  try {
    const offsetParam = req.nextUrl.searchParams.get('offset')
    const offset = offsetParam ? parseInt(offsetParam) : 0
    const localDateParam = req.nextUrl.searchParams.get('local_date')
    const baseDate = isValidDateKey(localDateParam) ? localDateParam : todayKey()
    const targetDate = new Date(new Date(baseDate).getTime() + offset * 86400000).toISOString().slice(0, 10)

    const entry = await getOrCreateDailyEntry(targetDate)
    return successResponse(entry, 'Daily encouragement retrieved.')
  } catch (error) {
    console.error('[Daily] Error:', error)
    return serverErrorResponse()
  }
}
