import { NextRequest, NextResponse } from 'next/server'
import { WebhookReceiver, EgressStatus } from 'livekit-server-sdk'
import { prisma } from '@/lib/db/client'
import { buildRecordingPublicUrl } from '@/lib/prayer-live/recording'

const receiver = new WebhookReceiver(process.env.LIVEKIT_API_KEY ?? '', process.env.LIVEKIT_API_SECRET ?? '')

/**
 * POST /api/v1/prayer-live/webhook
 * LiveKit calls this when an egress (recording) finishes -- must be
 * registered as a webhook URL in the LiveKit Cloud project dashboard.
 * Signed with the same LIVEKIT_API_KEY/SECRET already configured, verified
 * via the Authorization header rather than a separate shared secret.
 */
export async function POST(req: NextRequest) {
  const body = await req.text()
  const authHeader = req.headers.get('authorization') ?? undefined

  let event
  try {
    event = await receiver.receive(body, authHeader)
  } catch (err) {
    console.error('[prayer-live] webhook signature verification failed:', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }

  if (event.event !== 'egress_ended' || !event.egressInfo) {
    return NextResponse.json({ ok: true })
  }

  const info = event.egressInfo
  const filepath = info.fileResults?.[0]?.filename

  try {
    if (info.status === EgressStatus.EGRESS_COMPLETE && filepath) {
      const durationNs = info.fileResults?.[0]?.duration ?? BigInt(0)
      await prisma.prayerLiveRecording.updateMany({
        where: { egress_id: info.egressId },
        data: {
          status: 'ready',
          file_url: buildRecordingPublicUrl(filepath),
          duration_seconds: Math.round(Number(durationNs) / 1_000_000_000),
        },
      })
    } else {
      await prisma.prayerLiveRecording.updateMany({
        where: { egress_id: info.egressId },
        data: { status: 'failed', error: info.error || 'Recording failed.' },
      })
    }
  } catch (err) {
    console.error('[prayer-live] webhook processing failed:', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
