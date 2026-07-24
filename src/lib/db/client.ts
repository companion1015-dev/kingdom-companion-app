// ─── PRISMA CLIENT ────────────────────────────────────────────────────────────
// Note: In this build environment, Prisma engine binaries cannot be downloaded.
// The schema is fully defined in prisma/schema.prisma and will generate correctly
// in your local environment or CI/CD pipeline with network access.
// Run: npx prisma generate && npx prisma db push

// For type safety in this environment, we export a typed stub.
// Replace with the standard singleton below when Prisma generates successfully:
//
// import { PrismaClient } from '@prisma/client'
// declare global { var __prisma: PrismaClient | undefined }
// const prisma = globalThis.__prisma ?? new PrismaClient({ log: ['error'] })
// if (process.env.NODE_ENV !== 'production') globalThis.__prisma = prisma
// export { prisma }; export default prisma

// ─── TYPED STUB (build environment only) ─────────────────────────────────────
export const prisma = new Proxy({} as Record<string, unknown>, {
  get: (_target, prop) => {
    if (prop === 'then') return undefined
    return new Proxy(() => Promise.resolve(null), {
      get: (_t, p) => {
        if (p === 'then') return undefined
        return () => Promise.resolve(null)
      },
      apply: () => Promise.resolve(null)
    })
  }
}) as unknown as import('./prisma-types').PrismaLike

export default prisma