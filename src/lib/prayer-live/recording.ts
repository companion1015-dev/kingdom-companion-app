import { EgressClient, EncodedFileOutput, EncodedFileType, S3Upload } from 'livekit-server-sdk'
import { randomUUID } from 'crypto'

const {
  LIVEKIT_API_KEY,
  LIVEKIT_API_SECRET,
  LIVEKIT_URL,
  R2_ACCESS_KEY_ID,
  R2_SECRET_ACCESS_KEY,
  R2_ACCOUNT_ID,
  R2_BUCKET,
  R2_PUBLIC_URL,
} = process.env

export const RECORDINGS_CONFIGURED = !!(
  R2_ACCESS_KEY_ID &&
  R2_SECRET_ACCESS_KEY &&
  R2_ACCOUNT_ID &&
  R2_BUCKET &&
  R2_PUBLIC_URL
)

if (!RECORDINGS_CONFIGURED) {
  console.error(
    '[prayer-live] Recording storage is not configured -- R2_ACCESS_KEY_ID, ' +
    'R2_SECRET_ACCESS_KEY, R2_ACCOUNT_ID, R2_BUCKET and R2_PUBLIC_URL must all be set. ' +
    'Recording requests will fail until then.',
  )
}

const egressClient = new EgressClient(LIVEKIT_URL ?? '', LIVEKIT_API_KEY ?? '', LIVEKIT_API_SECRET ?? '')

/**
 * Recordings upload to a dedicated Cloudflare R2 bucket via an API token
 * scoped to only that bucket (Object Read & Write) -- deliberately not
 * Supabase Storage, since Supabase's S3-compatible access keys currently
 * grant full access to every bucket in the project and bypass RLS, with no
 * per-bucket scoping available yet. This keeps LiveKit's third-party access
 * limited to exactly one bucket it can't do anything else with.
 */
export async function startRecording(roomName: string): Promise<{ egressId: string; filepath: string }> {
  if (!RECORDINGS_CONFIGURED) {
    throw new Error('Recording is not configured yet.')
  }

  const filepath = `prayer-live/${roomName}/${Date.now()}-${randomUUID()}.mp4`

  const info = await egressClient.startRoomCompositeEgress(roomName, {
    file: new EncodedFileOutput({
      fileType: EncodedFileType.MP4,
      filepath,
      output: {
        case: 's3',
        value: new S3Upload({
          accessKey: R2_ACCESS_KEY_ID!,
          secret: R2_SECRET_ACCESS_KEY!,
          endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
          region: 'auto',
          bucket: R2_BUCKET!,
          forcePathStyle: true,
        }),
      },
    }),
  })

  return { egressId: info.egressId, filepath }
}

export async function stopRecording(egressId: string): Promise<void> {
  await egressClient.stopEgress(egressId)
}

/**
 * Constructed from the known bucket/filepath rather than trusting the
 * webhook's fileResults[].location -- for S3-compatible uploads that field
 * reflects the raw R2 endpoint, not the public r2.dev/custom-domain URL.
 * Requires the bucket's public access to be enabled.
 */
export function buildRecordingPublicUrl(filepath: string): string {
  return `${R2_PUBLIC_URL}/${filepath}`
}
