import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import crypto from 'crypto'
import { prisma } from '@/lib/db/client'

// ─── CONSTANTS ────────────────────────────────────────────────────────────────
const BCRYPT_ROUNDS        = 12
const ACCESS_TOKEN_EXPIRY  = '15m'
const REFRESH_TOKEN_EXPIRY = '30d'
const REFRESH_TOKEN_EXPIRY_MS = 30 * 24 * 60 * 60 * 1000
const VERIFY_TOKEN_EXPIRY_MS  =  24 * 60 * 60 * 1000
const RESET_TOKEN_EXPIRY_MS   =   1 * 60 * 60 * 1000

// ─── PASSWORD ─────────────────────────────────────────────────────────────────

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_ROUNDS)
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

// ─── JWT TOKENS ───────────────────────────────────────────────────────────────

type AccessTokenPayload = {
  sub:   string
  email: string
  role:  string
  type:  'access'
}

type RefreshTokenPayload = {
  sub:        string
  session_id: string
  type:       'refresh'
}

export function signAccessToken(payload: Omit<AccessTokenPayload, 'type'>): string {
  return jwt.sign(
    { ...payload, type: 'access' },
    process.env.JWT_SECRET!,
    { expiresIn: ACCESS_TOKEN_EXPIRY },
  )
}

export function signRefreshToken(payload: Omit<RefreshTokenPayload, 'type'>): string {
  return jwt.sign(
    { ...payload, type: 'refresh' },
    process.env.JWT_REFRESH_SECRET!,
    { expiresIn: REFRESH_TOKEN_EXPIRY },
  )
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  return jwt.verify(token, process.env.JWT_SECRET!) as AccessTokenPayload
}

export function verifyRefreshToken(token: string): RefreshTokenPayload {
  return jwt.verify(token, process.env.JWT_REFRESH_SECRET!) as RefreshTokenPayload
}

// ─── SESSIONS ─────────────────────────────────────────────────────────────────

export async function createSession(
  userId: string,
  deviceInfo?: string,
  ipAddress?: string,
): Promise<{ accessToken: string; refreshToken: string; sessionId: string }> {
  const rawRefreshToken = crypto.randomBytes(64).toString('hex')
  const expiresAt = new Date(Date.now() + REFRESH_TOKEN_EXPIRY_MS)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const session = await (prisma as any).session.create({
    data: {
      user_id:       userId,
      refresh_token: rawRefreshToken,
      device_info:   deviceInfo,
      ip_address:    ipAddress,
      expires_at:    expiresAt,
    },
  }) as { id: string }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const user = await (prisma as any).user.findUnique({
    where: { id: userId },
    select: { email: true, role: true },
  }) as { email: string; role: string } | null

  if (!user) throw new Error('User not found when creating session')

  const accessToken  = signAccessToken({ sub: userId, email: user.email, role: user.role })
  const refreshToken = signRefreshToken({ sub: userId, session_id: session.id })

  return { accessToken, refreshToken: rawRefreshToken, sessionId: session.id }
}

export async function rotateRefreshToken(
  rawRefreshToken: string,
  ipAddress?: string,
): Promise<{ accessToken: string; refreshToken: string }> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const session = await (prisma as any).session.findUnique({
    where: { refresh_token: rawRefreshToken },
    include: { user: { select: { id: true, email: true, role: true, account_status: true } } },
  }) as {
    id: string
    revoked_at: Date | null
    expires_at: Date
    device_info: string | null
    user: { id: string; email: string; role: string; account_status: string }
  } | null

  if (!session || session.revoked_at || session.expires_at < new Date()) {
    throw new Error('INVALID_REFRESH_TOKEN')
  }

  if (session.user.account_status !== 'active') {
    throw new Error('ACCOUNT_SUSPENDED')
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (prisma as any).session.update({
    where: { id: session.id },
    data:  { revoked_at: new Date() },
  })

  const { accessToken, refreshToken } = await createSession(
    session.user.id,
    session.device_info ?? undefined,
    ipAddress,
  )

  return { accessToken, refreshToken }
}

export async function revokeSession(rawRefreshToken: string): Promise<void> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (prisma as any).session.updateMany({
    where: { refresh_token: rawRefreshToken },
    data:  { revoked_at: new Date() },
  })
}

export async function revokeAllUserSessions(userId: string): Promise<void> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (prisma as any).session.updateMany({
    where: { user_id: userId, revoked_at: null },
    data:  { revoked_at: new Date() },
  })
}

// ─── VERIFICATION TOKENS ──────────────────────────────────────────────────────

export async function createVerificationToken(
  userId: string,
  type: 'email_verification' | 'password_reset',
): Promise<string> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (prisma as any).verificationToken.updateMany({
    where: { user_id: userId, type, used_at: null },
    data:  { used_at: new Date() },
  })

  const token     = crypto.randomBytes(32).toString('hex')
  const expiryMs  = type === 'password_reset' ? RESET_TOKEN_EXPIRY_MS : VERIFY_TOKEN_EXPIRY_MS
  const expiresAt = new Date(Date.now() + expiryMs)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (prisma as any).verificationToken.create({
    data: { user_id: userId, token, type, expires_at: expiresAt },
  })

  return token
}

export async function consumeVerificationToken(
  token: string,
  type: 'email_verification' | 'password_reset',
): Promise<string> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const record = await (prisma as any).verificationToken.findUnique({
    where: { token },
  }) as {
    id: string
    user_id: string
    type: string
    used_at: Date | null
    expires_at: Date
  } | null

  if (!record)                        throw new Error('TOKEN_NOT_FOUND')
  if (record.type !== type)           throw new Error('TOKEN_INVALID')
  if (record.used_at)                 throw new Error('TOKEN_ALREADY_USED')
  if (record.expires_at < new Date()) throw new Error('TOKEN_EXPIRED')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (prisma as any).verificationToken.update({
    where: { id: record.id },
    data:  { used_at: new Date() },
  })

  return record.user_id
}

// ─── AUDIT LOGGING ────────────────────────────────────────────────────────────

export async function logAuthEvent(
  action: string,
  userId?: string,
  ipAddress?: string,
  metadata?: Record<string, unknown>,
): Promise<void> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (prisma as any).auditLog.create({
      data: {
        user_id:    userId,
        action,
        entity:     'auth',
        ip_address: ipAddress,
        metadata:   metadata as object,
      },
    })
  } catch {
    console.error('[AuditLog] Failed to write auth event:', action)
  }
}