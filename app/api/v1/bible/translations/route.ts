// GET /api/v1/bible/translations
import { getTranslations } from '@/modules/bible/services/bible-api'
import { successResponse, serverErrorResponse } from '@/lib/api-response'

export async function GET() {
  try {
    const translations = await getTranslations()
    return successResponse(translations, 'Translations retrieved successfully.')
  } catch {
    return serverErrorResponse()
  }
}
