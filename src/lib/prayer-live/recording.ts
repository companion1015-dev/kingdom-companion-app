import { EgressClient, EncodedFileOutput, EncodedFileType, S3Upload } from 'livekit-server-sdk'
import { randomUUID } from 'crypto'

const {
  LIVEKIT_API_KEY,
  LIVEKIT_API_SECRET,
  LIVEKIT_URL,
  SUPABASE_S3_ACCESS_KEY_ID,
  SUPABASE_S3_SECRET_ACCESS_KEY,
  SUPABASE_S3_ENDPOINT,
  SUPABASE_S3_REGION,
  SUPABASE_STORAGE_BUCKET,
  NEXT_PUBLIC_SUPABASE_URL,
} = process.env

export const RECORDINGS_CONFIGURED = !!(
  SUPABASE_S3_ACCESS_KEY_ID &&
  SUPABASE_S3_SECRET_ACCESS_KEY &&
  SUPABASE_S3_ENDPOINT &&
  SUPABASE_S3_REGION &&
  SUPABASE_STORAGE_BUCKET
)

if (!RECORDINGS_CONFIGURED) {
  console.error(
    '[prayer-live] Recording storage is not configured -- SUPABASE_S3_ACCESS_KEY_ID, ' +
    'SUPABASE_S3_SECRET_ACCESS_KEY, SUPABASE_S3_ENDPOINT, SUPABASE_S3_REGION and ' +
    'SUPABASE_STORAGE_BUCKET must all be set. Recording requests will fail until then.',
  )
}

const egressClient = new EgressClient(LIVEKIT_URL ?? '', LIVEKIT_API_KEY ?? '', LIVEKIT_API_SECRET ?? '')

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
          accessKey: SUPABASE_S3_ACCESS_KEY_ID!,
          secret: SUPABASE_S3_SECRET_ACCESS_KEY!,
          endpoint: SUPABASE_S3_ENDPOINT!,
          region: SUPABASE_S3_REGION!,
          bucket: SUPABASE_STORAGE_BUCKET!,
          // Supabase's S3-compatible gateway requires path-style addressing
          // (bucket in the URL path), unlike AWS S3's virtual-hosted style.
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
 * reflects the raw S3 endpoint, not necessarily Supabase's public object URL.
 * Requires the bucket to be public.
 */
export function buildRecordingPublicUrl(filepath: string): string {
  return `${NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${SUPABASE_STORAGE_BUCKET}/${filepath}`
}
