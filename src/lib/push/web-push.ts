import webpush from 'web-push'

// Configures the `web-push` library once per server instance with this
// app's VAPID key pair (generated locally -- see .env.example -- not a
// third-party account credential). Used by /api/v1/push/send-daily to
// actually deliver the Daily Devotional reminder notification.

let configured = false

function ensureConfigured() {
  if (configured) return
  const publicKey  = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
  const privateKey = process.env.VAPID_PRIVATE_KEY
  const subject    = process.env.VAPID_SUBJECT ?? 'mailto:support@kingdomcompanion.app'
  if (!publicKey || !privateKey) {
    throw new Error('VAPID keys are not configured (NEXT_PUBLIC_VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY).')
  }
  webpush.setVapidDetails(subject, publicKey, privateKey)
  configured = true
}

export type PushSubscriptionKeys = { endpoint: string; p256dh: string; auth: string }

// Returns 'sent' | 'gone' (subscription is dead, caller should delete it) |
// 'error' (transient failure, caller should leave the row alone and retry
// another day).
export async function sendPush(
  sub: PushSubscriptionKeys,
  payload: { title: string; body: string; url: string },
): Promise<'sent' | 'gone' | 'error'> {
  ensureConfigured()
  try {
    await webpush.sendNotification(
      { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
      JSON.stringify(payload),
    )
    return 'sent'
  } catch (err) {
    const statusCode = (err as { statusCode?: number })?.statusCode
    if (statusCode === 404 || statusCode === 410) return 'gone'
    console.error('[Push] sendNotification failed:', err)
    return 'error'
  }
}
