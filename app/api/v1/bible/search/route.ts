import { NextRequest } from 'next/server'
import { searchBible } from '@/modules/bible/services/bible-api'
import { successResponse, errorResponse, serverErrorResponse } from '@/lib/api-response'

export async function GET(req: NextRequest) {
  try {
    const query       = req.nextUrl.searchParams.get('q') ?? ''
    const translation = req.nextUrl.searchParams.get('translation') ?? 'NIV'
    const limit       = Math.min(parseInt(req.nextUrl.searchParams.get('limit') ?? '20'), 50)

    if (!query.trim()) {
      return errorResponse('MISSING_QUERY', 'Search query is required.', 400)
    }

    const results = await searchBible(query, translation, limit)
    return successResponse(results, 'Search completed successfully.')
  } catch {
    return serverErrorResponse()
  }
}
