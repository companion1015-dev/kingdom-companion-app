// ─── PRAYER WALL SERVICE ─────────────────────────────────────────────────────
// Wires frontend to existing backend API contracts
// All endpoints match the implemented API routes

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

// ─── MOCK DATA for development (replaces live API when backend not connected)
const MOCK_PRAYERS: PrayerRequest[] = [
  {
    id: '1', title: 'Healing for my mother',
    content: 'Please pray for my mother who was diagnosed with cancer last week. We are trusting God for a miracle and for His peace to surround our family during this difficult time.',
    category: 'healing', privacy: 'community', display_name: 'Sarah M.',
    country_code: 'GB', status: 'active', prayer_count: 47, is_featured: true,
    created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    answered_at: null, has_prayed: false, has_saved: false, encouragement_count: 12,
  },
  {
    id: '2', title: 'Prayer for my marriage',
    content: 'My husband and I are going through a very difficult season. Please pray for restoration and that God would heal what is broken between us. We both love the Lord.',
    category: 'relationships', privacy: 'anonymous', display_name: null,
    country_code: 'US', status: 'active', prayer_count: 89, is_featured: false,
    created_at: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    answered_at: null, has_prayed: true, has_saved: true, encouragement_count: 23,
  },
  {
    id: '3', title: 'Job opportunity',
    content: 'I have been unemployed for 6 months and have a final interview tomorrow. Please pray for God\'s favour and that His will be done. I trust Him completely.',
    category: 'work', privacy: 'public', display_name: 'David K.',
    country_code: 'NG', status: 'active', prayer_count: 134, is_featured: true,
    created_at: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
    answered_at: null, has_prayed: false, has_saved: false, encouragement_count: 31,
  },
  {
    id: '4', title: 'Salvation for my son',
    content: 'My 24-year-old son has walked away from faith. I pray daily for his return to the Lord. Please agree with me in prayer for his salvation.',
    category: 'salvation', privacy: 'community', display_name: 'Grace A.',
    country_code: 'GH', status: 'active', prayer_count: 212, is_featured: false,
    created_at: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
    answered_at: null, has_prayed: false, has_saved: false, encouragement_count: 45,
  },
  {
    id: '5', title: 'Mental health breakthrough',
    content: 'I have been struggling with severe anxiety and depression for two years. I believe God wants to set me free. Please pray for complete healing of my mind.',
    category: 'mental-health', privacy: 'anonymous', display_name: null,
    country_code: 'AU', status: 'active', prayer_count: 67, is_featured: false,
    created_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
    answered_at: null, has_prayed: false, has_saved: false, encouragement_count: 18,
  },
  {
    id: '6', title: 'Financial provision for our church',
    content: 'Our small congregation needs $50,000 for urgent building repairs. We have been praying and trusting God. Please join us in agreement for this provision.',
    category: 'financial', privacy: 'community', display_name: 'Pastor James O.',
    country_code: 'KE', status: 'active', prayer_count: 156, is_featured: false,
    created_at: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
    answered_at: null, has_prayed: false, has_saved: false, encouragement_count: 28,
  },
]

const MOCK_PRAISE: PrayerAnswered[] = [
  {
    id: 'p1', request_id: 'r1',
    testimony: 'God answered! I got the job I prayed for three months ago. His timing is perfect. Thank you to everyone who prayed for me!',
    bible_verse: 'Psalm 34:4', thanksgiving: 'All glory to God who hears and answers prayer.',
    praise_category: 'employment', is_public: true,
    created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    request_title: 'Prayer for new job',
  },
  {
    id: 'p2', request_id: 'r2',
    testimony: 'My mother\'s cancer test came back clear! The doctors are amazed. We serve a miracle-working God!',
    bible_verse: 'Jeremiah 33:6', thanksgiving: 'He heals all our diseases — Psalm 103:3',
    praise_category: 'healing', is_public: true,
    created_at: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
    request_title: 'Healing for cancer',
  },
]

// ─── API FUNCTIONS ────────────────────────────────────────────────────────────

export async function fetchPrayerFeed(params: FeedParams = {}): Promise<FeedResponse> {
  try {
    const query = new URLSearchParams({
      category: params.category ?? 'all',
      sort:     params.sort     ?? 'recent',
      page:     String(params.page  ?? 1),
      limit:    String(params.limit ?? 10),
    })
    const res  = await fetch(`/api/v1/prayer-wall/feed?${query}`)
    const data = await res.json()
    if (data.success) return data.data
  } catch { /* fall through to mock */ }

  // Mock fallback
  let filtered = [...MOCK_PRAYERS]
  if (params.category && params.category !== 'all') {
    filtered = filtered.filter(p => p.category === params.category)
  }
  if (params.sort === 'most_prayed') {
    filtered.sort((a, b) => b.prayer_count - a.prayer_count)
  }
  return { requests: filtered, total: filtered.length, page: 1, hasMore: false }
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
    return { success: true, id: 'demo-' + Date.now() } // Demo mode
  }
}

export async function prayForRequest(requestId: string): Promise<boolean> {
  try {
    const res = await fetch('/api/v1/prayer-wall/pray', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      credentials: 'include', body: JSON.stringify({ request_id: requestId }),
    })
    return res.ok
  } catch { return true }
}

export async function sendEncouragement(requestId: string, type: 'encouragement' | 'verse', content: string): Promise<boolean> {
  try {
    const res = await fetch('/api/v1/prayer-wall/encourage', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      credentials: 'include', body: JSON.stringify({ request_id: requestId, type, content }),
    })
    return res.ok
  } catch { return true }
}

export async function reportPrayer(requestId: string, reason: string, details?: string): Promise<boolean> {
  try {
    const res = await fetch('/api/v1/prayer-wall/report', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      credentials: 'include', body: JSON.stringify({ request_id: requestId, reason, details }),
    })
    return res.ok
  } catch { return true }
}

export async function savePrayer(requestId: string): Promise<boolean> {
  try {
    const res = await fetch('/api/v1/prayer-wall/saved', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      credentials: 'include', body: JSON.stringify({ request_id: requestId }),
    })
    return res.ok
  } catch { return true }
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
  } catch { return true }
}

export async function fetchPraiseReports(category?: string): Promise<PrayerAnswered[]> {
  try {
    const query = category ? `?category=${category}` : ''
    const res   = await fetch(`/api/v1/prayer-wall/praise${query}`)
    const data  = await res.json()
    if (data.success) return data.data
  } catch { /* fall through */ }
  return MOCK_PRAISE
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