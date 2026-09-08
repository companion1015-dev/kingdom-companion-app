// ─── PRAYER WALL SERVICE ─────────────────────────────────────────────────────
// Wires frontend to the real backend API contracts (see src/app/api/v1/prayer-wall/*).
//
// Real fix: this previously fell back to hardcoded MOCK_PRAYERS/MOCK_PRAISE
// (fake names, fake health/marriage/financial crises presented as if real)
// on ANY fetch failure or unsuccessful API response, and every mutation
// (submit, pray, encourage, report, save) silently returned success:true
// from its catch block on a network error -- telling a real person their
// prayer request was submitted, or that they prayed for someone, when
// nothing had actually reached the server. Every function below now
// surfaces failure honestly instead of inventing content or a fake result.

import type { PrayerRequest, PrayerAnswered, PrayerCategory } from '../types'

export type FeedParams = {
  category?: PrayerCategory | 'all'
  sort?:     'recent' | 'most_prayed' | 'answered'
  page?:     number
  limit?:    number
}

export type FeedResponse = {
  requests: PrayerRequest[]
  total:    number
  page:     number
  hasMore:  boolean
}

export async function fetchPrayerFeed(params: FeedParams = {}): Promise<FeedResponse> {
  const query = new URLSearchParams({
    category: params.category ?? 'all',
    sort:     params.sort     ?? 'recent',
    page:     String(params.page  ?? 1),
    limit:    String(params.limit ?? 10),
  })
  const res  = await fetch(`/api/v1/prayer-wall/feed?${query}`)
  const data = await res.json()
  if (!data.success) throw new Error(data.error?.message ?? 'Failed to load the Prayer Wall.')
  return data.data
}

export async function submitPrayerRequest(data: {
  title:        string
  content:      string
  category:     string
  privacy:      string
  display_name: string
  attachment?:  File | null
}): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    // If there is an attachment, use FormData
    if (data.attachment) {
      const form = new FormData()
      Object.entries(data).forEach(([k, v]) => {
        if (v && v !== data.attachment) form.append(k, String(v))
      })
      form.append('attachment', data.attachment)
      const res  = await fetch('/api/v1/prayer-wall/submit', { method: 'POST', body: form, credentials: 'include' })
      const json = await res.json()
      return json.success ? { success: true, id: json.data?.id } : { success: false, error: json.error?.message }
    }

    const res  = await fetch('/api/v1/prayer-wall/submit', {
      method:      'POST',
      headers:     { 'Content-Type': 'application/json' },
      credentials: 'include',
      body:        JSON.stringify(data),
    })
    const json = await res.json()
    return json.success ? { success: true, id: json.data?.id } : { success: false, error: json.error?.message }
  } catch {
    return { success: false, error: 'Could not reach the server. Please check your connection and try again.' }
  }
}

export async function prayForRequest(requestId: string): Promise<boolean> {
  try {
    const res = await fetch('/api/v1/prayer-wall/pray', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      credentials: 'include', body: JSON.stringify({ request_id: requestId }),
    })
    return res.ok
  } catch { return false }
}

export async function sendEncouragement(requestId: string, type: 'encouragement' | 'verse', content: string): Promise<boolean> {
  try {
    const res = await fetch('/api/v1/prayer-wall/encourage', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      credentials: 'include', body: JSON.stringify({ request_id: requestId, type, content }),
    })
    return res.ok
  } catch { return false }
}

export async function reportPrayer(requestId: string, reason: string, details?: string): Promise<boolean> {
  try {
    const res = await fetch('/api/v1/prayer-wall/report', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      credentials: 'include', body: JSON.stringify({ request_id: requestId, reason, details }),
    })
    return res.ok
  } catch { return false }
}

export async function savePrayer(requestId: string): Promise<boolean> {
  try {
    const res = await fetch('/api/v1/prayer-wall/saved', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      credentials: 'include', body: JSON.stringify({ request_id: requestId }),
    })
    return res.ok
  } catch { return false }
}

export async function markAnswered(requestId: string, data: {
  testimony: string; bible_verse?: string; thanksgiving?: string;
  praise_category: string; is_public: boolean
}): Promise<boolean> {
  try {
    const res = await fetch('/api/v1/prayer-wall/answer', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      credentials: 'include', body: JSON.stringify({ request_id: requestId, ...data }),
    })
    return res.ok
  } catch { return false }
}

export async function fetchPraiseReports(category?: string): Promise<PrayerAnswered[]> {
  const query = category ? `?category=${category}` : ''
  const res   = await fetch(`/api/v1/prayer-wall/praise${query}`)
  const data  = await res.json()
  if (!data.success) throw new Error(data.error?.message ?? 'Failed to load praise reports.')
  return data.data
}

export function formatPrayerTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins  = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days  = Math.floor(diff / 86400000)
  if (mins  < 60)  return `${mins}m ago`
  if (hours < 24)  return `${hours}h ago`
  if (days  < 7)   return `${days}d ago`
  return new Date(dateStr).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}
