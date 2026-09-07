import { NextRequest } from 'next/server'
import { successResponse, serverErrorResponse, unauthorizedResponse } from '@/lib/api-response'
import { prisma } from '@/lib/db/client'
import { getOrCreateDailyEntry } from '@/modules/daily/services/daily-entry'
import { sendPush } from '@/lib/push/web-push'

// GET /api/v1/push/send-daily -- triggered once daily by Vercel Cron (see
// vercel.json). Vercel's Hobby plan hard-fails deployment on any cron
// schedule more frequent than once/day (Pro allows down to once/minute),
// so this deliberately runs on a single daily UTC tick rather than
// hourly -- true "each subscriber's own local morning" delivery would
// need Pro-tier hourly cron. Every subscription whose own local calendar
// date hasn't been sent yet gets the push on this one daily pass, so
// delivery stays reliable regardless of plan; `preferred_hour` is stored
// per subscription for a future hourly-cron upgrade but isn't a hard gate
// here. Vercel signs its own cron requests with
// `Authorization: Bearer $CRON_SECRET` when that env var is set -- checked
// below so nobody else can trigger sends.

function formatLocalDate(localNow: Date): string {
  // localNow's UTC fields were deliberately shifted to represent the
  // subscriber's own wall-clock time (see below) -- format against
  // timeZone: 'UTC' so those fields are read as-is, not shifted again.
  return localNow.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' })
}

async function runDailyPushSend() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = prisma as any
  const subs = await db.pushSubscription.findMany()

  let sent = 0, skipped = 0, removed = 0, errored = 0

  for (const sub of subs) {
    // JS Date.getTimezoneOffset() semantics: UTC = local + offset, so
    // local = UTC - offset. Shifting "now" by the stored offset and then
    // reading its UTC fields yields the subscriber's own local wall time.
    const localNow = new Date(Date.now() - sub.timezone_offset_minutes * 60000)
    const localDate = localNow.toISOString().slice(0, 10)

    if (sub.last_sent_date === localDate) { skipped++; continue }

    try {
      const entry = await getOrCreateDailyEntry(localDate)
      const result = await sendPush(
        { endpoint: sub.endpoint, p256dh: sub.p256dh, auth: sub.auth },
        {
          title: `Today's Encouragement — ${formatLocalDate(localNow)}`,
          body: `${entry.title}\n"${entry.verse_text.slice(0, 110)}${entry.verse_text.length > 110 ? '…' : ''}" — ${entry.verse_reference}`,
          url: '/daily',
        },
      )

      if (result === 'sent') {
        await db.pushSubscription.update({ where: { id: sub.id }, data: { last_sent_date: localDate } })
        sent++
      } else if (result === 'gone') {
        await db.pushSubscription.delete({ where: { id: sub.id } })
        removed++
      } else {
        errored++
      }
    } catch (e) {
      console.error('[Push] send-daily entry error for subscription', sub.id, e)
      errored++
    }
  }

  return { total: subs.length, sent, skipped, removed, errored }
}

async function handle(req: NextRequest) {
  const secret = process.env.CRON_SECRET
  if (secret) {
    const auth = req.headers.get('authorization')
    if (auth !== `Bearer ${secret}`) return unauthorizedResponse('Invalid or missing cron authorization.')
  }

  try {
    const result = await runDailyPushSend()
    return successResponse(result, 'Daily push run complete.')
  } catch (error) {
    console.error('[Push] send-daily error:', error)
    return serverErrorResponse()
  }
}

export async function GET(req: NextRequest) {
  return handle(req)
}

export async function POST(req: NextRequest) {
  return handle(req)
}
