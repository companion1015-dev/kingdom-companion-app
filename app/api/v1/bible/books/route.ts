import { NextRequest } from 'next/server'
import { getBooks } from '@/modules/bible/services/bible-api'
import { successResponse, serverErrorResponse } from '@/lib/api-response'

export async function GET(req: NextRequest) {
  try {
    const translation = req.nextUrl.searchParams.get('translation') ?? 'NIV'
    const books = await getBooks(translation)
    return successResponse(books, 'Books retrieved successfully.')
  } catch {
    return serverErrorResponse()
  }
}
