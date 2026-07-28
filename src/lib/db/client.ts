// ─── PRISMA CLIENT ────────────────────────────────────────────────────────────
// CRITICAL FIX #1: this file previously exported a stubbed fake Proxy object
// that always returned Promise.resolve(null) for every single method call,
// on every model, with no exceptions -- a temporary sandbox placeholder that
// was never swapped out and had been silently deployed to production.
//
// CRITICAL FIX #2, found while fixing #1: Prisma 7 changed how PrismaClient
// itself is constructed. `new PrismaClient()` with no arguments is no longer
// valid at all -- it now requires an explicit database driver adapter to be
// passed in. Confirmed directly against Prisma's own v7 upgrade guide and
// multiple real bug reports of the exact error this caused:
// "Using engine type client requires either adapter or accelerateUrl".
// Since this project uses PostgreSQL (via Supabase), the fix is @prisma/adapter-pg.

import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'

declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined
}

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL })

export const prisma = globalThis.__prisma ?? new PrismaClient({ adapter, log: ['error'] })
if (process.env.NODE_ENV !== 'production') globalThis.__prisma = prisma

export default prisma