import { NextRequest } from 'next/server'
import { getTodayEntry, getEntryByOffset } from '@/modules/daily/data/entries'
import { successResponse, serverErrorResponse } from '@/lib/api-response'

export async function GET(req: NextRequest) {
  try {
    const offset = parseInt(req.nextUrl.searchParams.get('offset') ?? '0')
    const entry  = isNaN(offset) ? getTodayEntry() : getEntryByOffset(offset)
    return successResponse(entry, 'Daily encouragement retrieved.')
  } catch {
    return serverErrorResponse()
  }
}
