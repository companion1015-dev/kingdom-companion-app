// ─── PRISMA TYPE DEFINITIONS ─────────────────────────────────────────────────
// Mirrors prisma/schema.prisma exactly.
// Generated automatically when Prisma client is available.
// Used as the typed interface in build environments without Prisma engine binaries.

export type User = {
  id: string
  email: string
  email_verified_at: Date | null
  display_name: string
  password_hash: string | null
  auth_provider: string
  preferred_translation: string
  theme: string
  font_size: number
  account_status: string
  role: string
  created_at: Date
  updated_at: Date
  deleted_at: Date | null
  last_login_at: Date | null
}

export type Session = {
  id: string
  user_id: string
  refresh_token: string
  device_info: string | null
  ip_address: string | null
  expires_at: Date
  revoked_at: Date | null
  created_at: Date
}

export type VerificationToken = {
  id: string
  user_id: string
  token: string
  type: string
  expires_at: Date
  used_at: Date | null
  created_at: Date
}

export type Note = {
  id: string
  user_id: string
  translation_id: string
  book_id: string
  chapter: number
  verse_id: string
  verse_reference: string
  content: string
  tags: string[]
  created_at: Date
  updated_at: Date
  deleted_at: Date | null
}

export type Bookmark = {
  id: string
  user_id: string
  translation_id: string
  book_id: string
  chapter: number
  verse_id: string
  verse_reference: string
  collection_name: string | null
  tags: string[]
  created_at: Date
  deleted_at: Date | null
}

export type Highlight = {
  id: string
  user_id: string
  translation_id: string
  book_id: string
  chapter: number
  verse_id: string
  verse_reference: string
  color: string
  created_at: Date
  updated_at: Date
  deleted_at: Date | null
}

export type Prayer = {
  id: string
  user_id: string
  title: string
  content: string
  category: string | null
  status: string
  answered_at: Date | null
  created_at: Date
  updated_at: Date
  deleted_at: Date | null
}

export type AuditLog = {
  id: string
  user_id: string | null
  action: string
  entity: string
  entity_id: string | null
  ip_address: string | null
  metadata: Record<string, unknown> | null
  created_at: Date
}

export type AiConversation = {
  id: string
  user_id: string | null
  session_id: string | null
  title: string | null
  conversation_type: string
  created_at: Date
  updated_at: Date
}

export type AiMessage = {
  id: string
  conversation_id: string
  sender: string
  message: string
  scripture_refs: string[]
  created_at: Date
}

// ─── QUERY HELPERS ────────────────────────────────────────────────────────────

type ModelDelegate<T> = {
  findUnique:  (args: { where: Partial<T>; select?: Partial<Record<keyof T, boolean>>; include?: Record<string, unknown> }) => Promise<Partial<T> | null>
  findFirst:   (args: { where?: Partial<T>; select?: Partial<Record<keyof T, boolean>>; orderBy?: Partial<Record<keyof T, 'asc' | 'desc'>> }) => Promise<Partial<T> | null>
  findMany:    (args?: { where?: Partial<T>; select?: Partial<Record<keyof T, boolean>>; orderBy?: Partial<Record<keyof T, 'asc' | 'desc'>>; take?: number; skip?: number }) => Promise<Partial<T>[]>
  create:      (args: { data: Partial<T>; select?: Partial<Record<keyof T, boolean>> }) => Promise<Partial<T>>
  update:      (args: { where: Partial<T>; data: Partial<T>; select?: Partial<Record<keyof T, boolean>> }) => Promise<Partial<T>>
  updateMany:  (args: { where: Partial<T>; data: Partial<T> }) => Promise<{ count: number }>
  delete:      (args: { where: Partial<T> }) => Promise<Partial<T>>
  count:       (args?: { where?: Partial<T> }) => Promise<number>
}

export type PrismaLike = {
  user:              ModelDelegate<User>
  session:           ModelDelegate<Session>
  verificationToken: ModelDelegate<VerificationToken>
  note:              ModelDelegate<Note>
  bookmark:          ModelDelegate<Bookmark>
  highlight:         ModelDelegate<Highlight>
  prayer:            ModelDelegate<Prayer>
  auditLog:          ModelDelegate<AuditLog>
  aiConversation:    ModelDelegate<AiConversation>
  aiMessage:         ModelDelegate<AiMessage>
  $disconnect:       () => Promise<void>
}