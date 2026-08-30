import { NextRequest } from 'next/server'
import { randomUUID } from 'crypto'
import { withAdmin } from '@/lib/auth/middleware'
import { successResponse, createdResponse, errorResponse, serverErrorResponse } from '@/lib/api-response'
import { prisma } from '@/lib/db/client'
import { uploadPublicFile, STORAGE_CONFIGURED } from '@/lib/storage/attachments'

// GET/POST /api/v1/admin/content/books
// Admin upload for whole book/manuscript files (PDF, EPUB, DOCX) -- the
// gap this closes: every other Content tab (Daily, Topics, Devotionals,
// Reading Plans) is admin-typed text, but an admin with an already-written
// book had no way to attach the actual file from their computer. Reuses
// the same R2 storage helper as Prayer Wall attachments
// (src/lib/storage/attachments.ts), just with book-sized limits and file types.

const MAX_FILE_SIZE = 50 * 1024 * 1024 // 50MB
const MAX_COVER_SIZE = 5 * 1024 * 1024 // 5MB
const ALLOWED_FILE_TYPES: Record<string, string> = {
  'application/pdf': 'pdf',
  'application/epub+zip': 'epub',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
}
const ALLOWED_COVER_TYPES = ['image/jpeg', 'image/png', 'image/webp']

export const GET = withAdmin(async () => {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const books = await (prisma as any).libraryBook.findMany({ orderBy: { created_at: 'desc' } })
    return successResponse(books, 'Books retrieved.')
  } catch (error) {
    console.error('[AdminContent] Books list error:', error)
    return serverErrorResponse()
  }
})

export const POST = withAdmin(async (req: NextRequest) => {
  try {
    const contentType = req.headers.get('content-type') ?? ''
    if (!contentType.includes('multipart/form-data')) {
      return errorResponse('MULTIPART_REQUIRED', 'Upload a book using a multipart/form-data request.', 400)
    }

    const form = await req.formData()
    const title       = String(form.get('title') ?? '').trim()
    const author_name = String(form.get('author_name') ?? '').trim()
    const description = form.get('description') ? String(form.get('description')).trim() : null
    const is_published = form.get('is_published') !== 'false'
    const file  = form.get('file')
    const cover = form.get('cover_image')

    if (!title || !author_name) return errorResponse('MISSING_FIELDS', 'title and author_name are required.', 400)
    if (!(file instanceof File)) return errorResponse('MISSING_FILE', 'A book file (PDF, EPUB, or DOCX) is required.', 400)

    const ext = ALLOWED_FILE_TYPES[file.type]
    if (!ext) return errorResponse('INVALID_FILE_TYPE', 'Book file must be a PDF, EPUB, or DOCX.', 400)
    if (file.size > MAX_FILE_SIZE) return errorResponse('FILE_TOO_LARGE', 'Book file must be under 50MB.', 400)
    if (cover instanceof File) {
      if (!ALLOWED_COVER_TYPES.includes(cover.type)) return errorResponse('INVALID_COVER_TYPE', 'Cover image must be JPG, PNG, or WebP.', 400)
      if (cover.size > MAX_COVER_SIZE) return errorResponse('COVER_TOO_LARGE', 'Cover image must be under 5MB.', 400)
    }

    if (!STORAGE_CONFIGURED) {
      return errorResponse('STORAGE_UNAVAILABLE', 'File storage is not configured yet.', 503)
    }

    const fileBuffer = Buffer.from(await file.arrayBuffer())
    const fileKey     = `library/${randomUUID()}.${ext}`
    const file_url     = await uploadPublicFile(fileBuffer, fileKey, file.type)

    let cover_image_url: string | null = null
    if (cover instanceof File) {
      const coverBuffer = Buffer.from(await cover.arrayBuffer())
      const coverExt    = cover.type === 'image/png' ? 'png' : cover.type === 'image/webp' ? 'webp' : 'jpg'
      cover_image_url    = await uploadPublicFile(coverBuffer, `library/covers/${randomUUID()}.${coverExt}`, cover.type)
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const book = await (prisma as any).libraryBook.create({
      data: {
        title, author_name, description, is_published,
        file_url, file_type: ext, file_size_bytes: file.size, cover_image_url,
      },
    })

    return createdResponse(book, 'Book uploaded.')
  } catch (error) {
    console.error('[AdminContent] Book upload error:', error)
    return serverErrorResponse()
  }
})
