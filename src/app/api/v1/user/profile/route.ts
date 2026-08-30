import { NextRequest } from 'next/server'
import { withAuth } from '@/lib/auth/middleware'
import { successResponse, errorResponse, serverErrorResponse } from '@/lib/api-response'
import { prisma } from '@/lib/db/client'

// GET/PATCH /api/v1/user/profile
// Genuinely new -- no profile or settings endpoint existed anywhere in the
// app before this. Users could register and use every feature, but had no
// way to update their display name, preferred Bible translation, theme, or
// font size after the fact.

const VALID_TRANSLATIONS = ['BSB', 'KJV', 'ASV', 'WEBUS']
const VALID_THEMES = ['light', 'dark']

export const GET = withAuth(async (_req: NextRequest, user) => {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const profile = await (prisma as any).user.findUnique({
      where: { id: user.id },
      select: {
        email: true, display_name: true, preferred_translation: true,
        theme: true, font_size: true, created_at: true, email_verified_at: true,
      },
    })
    if (!profile) return errorResponse('NOT_FOUND', 'Profile not found.', 404)
    // role comes from the verified JWT (withAuth), not re-fetched from the
    // DB above -- Navigation.tsx uses it to conditionally show Admin links.
    return successResponse({ ...profile, role: user.role }, 'Profile retrieved.')
  } catch (error) {
    console.error('[Profile] Get error:', error)
    return serverErrorResponse()
  }
})

export const PATCH = withAuth(async (req: NextRequest, user) => {
  try {
    const body = await req.json()
    const { display_name, preferred_translation, theme, font_size } = body

    const data: Record<string, unknown> = {}

    if (display_name !== undefined) {
      if (!display_name.trim() || display_name.trim().length > 100) {
        return errorResponse('INVALID_NAME', 'Display name must be between 1 and 100 characters.', 400)
      }
      data.display_name = display_name.trim()
    }
    if (preferred_translation !== undefined) {
      if (!VALID_TRANSLATIONS.includes(preferred_translation)) {
        return errorResponse('INVALID_TRANSLATION', 'Unsupported translation.', 400)
      }
      data.preferred_translation = preferred_translation
    }
    if (theme !== undefined) {
      if (!VALID_THEMES.includes(theme)) return errorResponse('INVALID_THEME', 'Theme must be light or dark.', 400)
      data.theme = theme
    }
    if (font_size !== undefined) {
      const size = Number(font_size)
      if (isNaN(size) || size < 12 || size > 28) return errorResponse('INVALID_FONT_SIZE', 'Font size must be between 12 and 28.', 400)
      data.font_size = size
    }

    if (Object.keys(data).length === 0) return errorResponse('NO_CHANGES', 'No valid fields to update.', 400)

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (prisma as any).user.update({ where: { id: user.id }, data })

    return successResponse(null, 'Profile updated.')
  } catch (error) {
    console.error('[Profile] Update error:', error)
    return serverErrorResponse()
  }
})