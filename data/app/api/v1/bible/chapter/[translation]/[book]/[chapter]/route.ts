import { NextRequest } from 'next/server'
import { getChapter } from '@/modules/bible/services/bible-api'
import { successResponse, notFoundResponse, serverErrorResponse } from '@/lib/api-response'

type Params = { params: { translation: string; book: string; chapter: string } }

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const chapterNum = parseInt(params.chapter)
    if (isNaN(chapterNum) || chapterNum < 1) {
      return notFoundResponse('Chapter')
    }

    const chapter = await getChapter(
      params.translation.toUpperCase(),
      params.book.toUpperCase(),
      chapterNum,
    )

    if (!chapter) return notFoundResponse('Chapter')
    return successResponse(chapter, 'Chapter retrieved successfully.')
  } catch {
    return serverErrorResponse()
  }
}
