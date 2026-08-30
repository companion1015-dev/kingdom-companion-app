import { withAdmin } from '@/lib/auth/middleware'
import { successResponse } from '@/lib/api-response'

// TEMPORARY diagnostic -- reports presence/shape of storage env vars
// without leaking secret values, to find out whether Vercel's Production
// deployment actually has NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY
// set despite the dashboard showing them configured. Remove once resolved.

export const GET = withAdmin(async () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY

  let hostname: string | null = null
  try { hostname = url ? new URL(url).hostname : null } catch { hostname = 'INVALID_URL' }

  return successResponse({
    supabase_url_present: !!url,
    supabase_url_hostname: hostname,
    service_role_key_present: !!key,
    service_role_key_length: key?.length ?? 0,
    database_url_present: !!process.env.DATABASE_URL, // known-working, for comparison
    vercel_git_commit_sha: process.env.VERCEL_GIT_COMMIT_SHA ?? null,
    vercel_env: process.env.VERCEL_ENV ?? null,
  }, 'Diagnostic info.')
})
