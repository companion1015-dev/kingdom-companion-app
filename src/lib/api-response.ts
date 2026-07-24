import { NextResponse } from 'next/server'
import { z } from 'zod'

// ─── STANDARD API RESPONSE ENVELOPE ──────────────────────────────────────────
// ASD Chapter 5 §5.25 — Standard API Response Format

export type ApiSuccess<T = unknown> = {
  success: true
  data: T
  message: string
}

export type ApiError = {
  success: false
  error: {
    code: string
    message: string
    details?: Record<string, string[]>
  }
}

export function successResponse<T>(
  data: T,
  message: string = 'Request successful.',
  status: number = 200,
): NextResponse<ApiSuccess<T>> {
  return NextResponse.json({ success: true, data, message }, { status })
}

export function createdResponse<T>(
  data: T,
  message: string = 'Resource created successfully.',
): NextResponse<ApiSuccess<T>> {
  return NextResponse.json({ success: true, data, message }, { status: 201 })
}

export function errorResponse(
  code: string,
  message: string,
  status: number = 400,
  details?: Record<string, string[]>,
): NextResponse<ApiError> {
  return NextResponse.json(
    { success: false, error: { code, message, ...(details && { details }) } },
    { status },
  )
}

export function validationErrorResponse(error: z.ZodError): NextResponse<ApiError> {
  const details: Record<string, string[]> = {}
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const issues: any[] = (error as any).issues ?? []
  issues.forEach((e: { path: (string | number)[]; message: string }) => {
    const key = e.path.join('.') || '_'
    if (!details[key]) details[key] = []
    details[key].push(e.message)
  })
  return errorResponse('VALIDATION_ERROR', 'The request could not be processed.', 422, details)
}

export function unauthorizedResponse(message = 'Authentication required.'): NextResponse<ApiError> {
  return errorResponse('UNAUTHORIZED', message, 401)
}

export function forbiddenResponse(message = 'Access denied.'): NextResponse<ApiError> {
  return errorResponse('FORBIDDEN', message, 403)
}

export function notFoundResponse(resource = 'Resource'): NextResponse<ApiError> {
  return errorResponse('NOT_FOUND', `${resource} not found.`, 404)
}

export function serverErrorResponse(message = 'An unexpected error occurred.'): NextResponse<ApiError> {
  return errorResponse('INTERNAL_ERROR', message, 500)
}

export function rateLimitResponse(): NextResponse<ApiError> {
  return errorResponse('RATE_LIMITED', 'Too many requests. Please try again later.', 429)
}
