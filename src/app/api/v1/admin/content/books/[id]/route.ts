import { NextRequest } from 'next/server'
import { randomUUID } from 'crypto'
import { withAdmin } from '@/lib/auth/middleware'
import { successResponse, notFoundResponse, errorResponse, serverErrorResponse } from '@/lib/api-response'
import { prisma } from '@/lib/db/client'
import { uploadPublicFile, STORAGE_CONFIGURED } from '@/lib/storage/attachments'

// PATCH/DELETE /api/v1/admin/content/books/:id
// PATCH accepts multipart/form-data so the book file (or cover) can
// optionally be replaced in the same request as editing metadata.

const MAX_FILE_SIZE = 50 * 1024 * 1024
const MAX_COVER_SIZE = 5 * 1024 * 1024
const ALLOWED_FILE_TYPES: Record<string, string> = {
  'application/pdf': 'pdf',
  'application/epub+zip': 'epub',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
}
const ALLOWED_COVER_TYPES = ['image/jpeg', 'image/png', 'image/webp']

export const PATCH = withAdmin(async (req: NextRequest, _user, context) => {
  try {
    const id = context!.params.id
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = prisma as any
    const existing = await db.libraryBook.findUnique({ where: { id } })
    if (!existing) return notFoundResponse('Book')

    const contentType = req.headers.get('content-type') ?? ''
    const data: Record<string, unknown> = {}

    if (contentType.includes('multipart/form-data')) {
      const form = await req.formData()
      if (form.has('title'))         data.title = String(form.get('title')).trim()
      if (form.has('author_name'))   data.author_name = String(form.get('author_name')).trim()
      if (form.has('description'))   data.description = String(form.get('description')).trim() || null
      if (form.has('is_published'))  data.is_published = form.get('is_published') !== 'false'

      const file  = form.get('file')
      const cover = form.get('cover_image')

      let ext = ''
      if (file instanceof File) {
        ext = ALLOWED_FILE_TYPES[file.type]
        if (!ext) return errorResponse('INVALID_FILE_TYPE', 'Book file must be a PDF, EPUB, or DOCX.', 400)
        if (file.size > MAX_FILE_SIZE) return errorResponse('FILE_TOO_LARGE', 'Book file must be under 50MB.', 400)
      }
      if (cover instanceof File) {
        if (!ALLOWED_COVER_TYPES.includes(cover.type)) return errorResponse('INVALID_COVER_TYPE', 'Cover image must be JPG, PNG, or WebP.', 400)
        if (cover.size > MAX_COVER_SIZE) return errorResponse('COVER_TOO_LARGE', 'Cover image must be under 5MB.', 400)
      }
      if ((file instanceof File || cover instanceof File) && !STORAGE_CONFIGURED) {
        return errorResponse('STORAGE_UNAVAILABLE', 'File storage is not configured yet.', 503)
      }

      if (file instanceof File) {
        const buffer = Buffer.from(await file.arrayBuffer())
        data.file_url = await uploadPublicFile(buffer, `library/${randomUUID()}.${ext}`, file.type)
        data.file_type = ext
        data.file_size_bytes = file.size
      }
      if (cover instanceof File) {
        const buffer = Buffer.from(await cover.arrayBuffer())
        const coverExt = cover.type === 'image/png' ? 'png' : cover.type === 'image/webp' ? 'webp' : 'jpg'
        data.cover_image_url = await uploadPublicFile(buffer, `library/covers/${randomUUID()}.${coverExt}`, cover.type)
      }
    } else {
      const body = await req.json()
      if (body.title !== undefined)         data.title = body.title.trim()
      if (body.author_name !== undefined)   data.author_name = body.author_name.trim()
      if (body.description !== undefined)   data.description = body.description?.trim() || null
      if (body.is_published !== undefined)  data.is_published = !!body.is_published
    }

    const updated = await db.libraryBook.update({ where: { id }, data })
    return successResponse(updated, 'Book updated.')
  } catch (error) {
    console.error('[AdminContent] Book update error:', error)
    return serverErrorResponse()
  }
})

export const DELETE = withAdmin(async (_req: NextRequest, _user, context) => {
  try {
    const id = context!.params.id
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = prisma as any
    const existing = await db.libraryBook.findUnique({ where: { id } })
    if (!existing) return notFoundResponse('Book')
    await db.libraryBook.delete({ where: { id } })
    return successResponse({ deleted: true }, 'Book deleted.')
  } catch (error) {
    console.error('[AdminContent] Book delete error:', error)
    return serverErrorResponse()
  }
})
