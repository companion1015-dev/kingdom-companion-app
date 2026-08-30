import { createClient, SupabaseClient } from '@supabase/supabase-js'

// General-purpose file storage for Prayer Wall attachments and uploaded
// Library Books. Uses Supabase Storage (same project already backing the
// database), not Cloudflare R2 -- there was no R2 account available, and
// unlike the prayer-live recording pipeline (src/lib/prayer-live/recording.ts,
// which deliberately avoids Supabase Storage because its S3-compatible keys
// would hand LiveKit -- a third party -- broad, RLS-bypassing access), this
// helper's service-role key never leaves this server: only our own API
// routes call it, so that risk doesn't apply here.

const { NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = process.env
const BUCKET = 'kingdom-companion-assets'

export const STORAGE_CONFIGURED = !!(NEXT_PUBLIC_SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY)

if (!STORAGE_CONFIGURED) {
  console.error(
    '[storage] File storage is not configured -- NEXT_PUBLIC_SUPABASE_URL and ' +
    'SUPABASE_SERVICE_ROLE_KEY must both be set. Uploads will fail until then.',
  )
}

let client: SupabaseClient | null = null
function getClient(): SupabaseClient {
  if (!client) client = createClient(NEXT_PUBLIC_SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!)
  return client
}

/**
 * Uploads a file to the general-purpose Supabase Storage bucket and
 * returns its public URL.
 */
export async function uploadPublicFile(buffer: Buffer, key: string, contentType: string): Promise<string> {
  if (!STORAGE_CONFIGURED) {
    throw new Error('File storage is not configured yet.')
  }

  const { error } = await getClient().storage.from(BUCKET).upload(key, buffer, { contentType, upsert: false })
  if (error) throw new Error(`Upload failed: ${error.message}`)

  const { data } = getClient().storage.from(BUCKET).getPublicUrl(key)
  return data.publicUrl
}
