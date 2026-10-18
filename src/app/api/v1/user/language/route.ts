import { NextRequest } from 'next/server'
import { withAuth } from '@/lib/auth/middleware'
import { successResponse, errorResponse, serverErrorResponse } from '@/lib/api-response'
import { prisma } from '@/lib/db/client'
import { DEFAULT_LOCALE, isLocale } from '@/lib/i18n'

// GET/PUT /api/v1/user/language
// Stores the interface language in the existing UserSetting key/value table,
// so NO database migration is needed. Bible version stays in user.preferred_translation.
const KEY = 'interface_language'

export const GET = withAuth(async (_req: NextRequest, user) => {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const row = await (prisma as any).userSetting.findUnique({
      where: { user_id_setting_key: { user_id: user.id, setting_key: KEY } },
    })
    const lang = row && isLocale(row.setting_value) ? row.setting_value : DEFAULT_LOCALE
    return successResponse({ interface_language: lang }, 'Language retrieved.')
  } catch (error) {
    console.error('[Language] Get error:', error)
    return serverErrorResponse()
  }
})

export const PUT = withAuth(async (req: NextRequest, user) => {
  try {
    const body = await req.json().catch(() => null)
    const lang = body?.interface_language
    if (!isLocale(lang)) return errorResponse('INVALID_LANGUAGE', 'Unsupported language.', 400)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (prisma as any).userSetting.upsert({
      where: { user_id_setting_key: { user_id: user.id, setting_key: KEY } },
      update: { setting_value: lang },
      create: { user_id: user.id, setting_key: KEY, setting_value: lang },
    })
    return successResponse({ interface_language: lang }, 'Language saved.')
  } catch (error) {
    console.error('[Language] Update error:', error)
    return serverErrorResponse()
  }
})
