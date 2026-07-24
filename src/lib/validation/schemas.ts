import { z } from 'zod'

// ─── AUTH SCHEMAS ─────────────────────────────────────────────────────────────

export const RegisterSchema = z.object({
  display_name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must be under 100 characters')
    .trim(),
  email: z
    .string()
    .email('Please enter a valid email address')
    .max(255)
    .toLowerCase()
    .trim(),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password must be under 128 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  confirm_password: z.string(),
}).refine(data => data.password === data.confirm_password, {
  message: 'Passwords do not match',
  path: ['confirm_password'],
})

export const LoginSchema = z.object({
  email:    z.string().email().toLowerCase().trim(),
  password: z.string().min(1, 'Password is required'),
})

export const ForgotPasswordSchema = z.object({
  email: z.string().email('Please enter a valid email address').toLowerCase().trim(),
})

export const ResetPasswordSchema = z.object({
  token:            z.string().min(1),
  password:         z.string().min(8).max(128)
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  confirm_password: z.string(),
}).refine(data => data.password === data.confirm_password, {
  message: 'Passwords do not match',
  path: ['confirm_password'],
})

export const RefreshTokenSchema = z.object({
  refresh_token: z.string().min(1),
})

// ─── USER SCHEMAS ─────────────────────────────────────────────────────────────

export const UpdateProfileSchema = z.object({
  display_name:          z.string().min(2).max(100).trim().optional(),
  preferred_translation: z.enum(['NIV', 'KJV', 'NKJV', 'ESV', 'NLT', 'AMP', 'MSG']).optional(),
  theme:                 z.enum(['light', 'dark', 'high-contrast']).optional(),
  font_size:             z.number().int().min(12).max(28).optional(),
})

// ─── STUDY SCHEMAS ────────────────────────────────────────────────────────────

export const CreateNoteSchema = z.object({
  translation_id:  z.string().max(20),
  book_id:         z.string().max(20),
  chapter:         z.number().int().positive(),
  verse_id:        z.string().max(50),
  verse_reference: z.string().max(100),
  content:         z.string().min(1, 'Note content is required').max(10000),
  tags:            z.array(z.string().max(50)).max(10).optional(),
})

export const UpdateNoteSchema = CreateNoteSchema.partial().omit({
  translation_id: true, book_id: true, chapter: true, verse_id: true, verse_reference: true,
})

export const CreateBookmarkSchema = z.object({
  translation_id:  z.string().max(20),
  book_id:         z.string().max(20),
  chapter:         z.number().int().positive(),
  verse_id:        z.string().max(50),
  verse_reference: z.string().max(100),
  collection_name: z.string().max(100).optional(),
  tags:            z.array(z.string().max(50)).max(10).optional(),
})

export const CreateHighlightSchema = z.object({
  translation_id:  z.string().max(20),
  book_id:         z.string().max(20),
  chapter:         z.number().int().positive(),
  verse_id:        z.string().max(50),
  verse_reference: z.string().max(100),
  color:           z.enum(['yellow', 'green', 'blue', 'pink', 'orange']).default('yellow'),
})

// ─── PRAYER SCHEMAS ───────────────────────────────────────────────────────────

export const CreatePrayerSchema = z.object({
  title:               z.string().min(1).max(255).trim(),
  content:             z.string().min(1, 'Prayer content is required').max(10000),
  category:            z.string().max(100).optional(),
  tags:                z.string().max(255).optional(),
  scripture_reference: z.string().max(100).optional(),
})

export const UpdatePrayerSchema = z.object({
  title:               z.string().min(1).max(255).trim().optional(),
  content:             z.string().min(1).max(10000).optional(),
  category:            z.string().max(100).optional(),
  tags:                z.string().max(255).optional(),
  scripture_reference: z.string().max(100).optional(),
  status:              z.enum(['active', 'answered', 'archived']).optional(),
})

// ─── READING PLANS PROGRESS SYNC ───────────────────────────────────────────────
// Reading Plans Progress product decisions (Option C, anonymous-first with
// optional authenticated sync) — day-level, one record per user per plan,
// destructive reset represented via the `reset` flag rather than a separate
// DELETE endpoint (minimum required GET/PUT surface only, per approved scope).

export const ReadingProgressEntrySchema = z.object({
  planId:      z.string().uuid(),
  currentDay:  z.number().int().min(1),
  completed:   z.boolean(),
  paused:      z.boolean(),
  startedAt:   z.string(),
  reset:       z.boolean().optional(),
})

export const SyncReadingProgressSchema = z.object({
  entries: z.array(ReadingProgressEntrySchema).max(100),
  // max(100): a sanity ceiling, not a product limit — no plausible user has
  // progress on more plans than this; prevents a malformed client payload
  // from becoming an unbounded write.
})

// ─── AI SCHEMAS ───────────────────────────────────────────────────────────────

export const AiChatSchema = z.object({
  message:           z.string().min(1).max(2000).trim(),
  conversation_id:   z.string().uuid().optional(),
  conversation_type: z.enum([
    'Bible Study', 'Prayer Assistant', 'Devotional',
    'General Questions', 'Character Study', 'Topic Study',
  ]).default('General Questions'),
  translation:       z.string().max(20).default('NIV'),
})

// ─── FEEDBACK SCHEMAS ─────────────────────────────────────────────────────────

export const FeedbackSchema = z.object({
  feedback_type: z.enum(['Bug Report', 'Feature Request', 'General Feedback']),
  subject:       z.string().min(1).max(255).trim(),
  message:       z.string().min(10).max(5000).trim(),
})

// ─── TYPE EXPORTS ─────────────────────────────────────────────────────────────

export type RegisterInput         = z.infer<typeof RegisterSchema>
export type LoginInput            = z.infer<typeof LoginSchema>
export type ForgotPasswordInput   = z.infer<typeof ForgotPasswordSchema>
export type ResetPasswordInput    = z.infer<typeof ResetPasswordSchema>
export type UpdateProfileInput    = z.infer<typeof UpdateProfileSchema>
export type CreateNoteInput       = z.infer<typeof CreateNoteSchema>
export type CreateBookmarkInput   = z.infer<typeof CreateBookmarkSchema>
export type CreateHighlightInput  = z.infer<typeof CreateHighlightSchema>
export type CreatePrayerInput     = z.infer<typeof CreatePrayerSchema>
export type UpdatePrayerInput     = z.infer<typeof UpdatePrayerSchema>
export type AiChatInput           = z.infer<typeof AiChatSchema>