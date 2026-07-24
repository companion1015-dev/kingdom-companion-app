// ─── REFERRAL TYPES ───────────────────────────────────────────────────────────
// Referral System Requirements — v1.0 foundation only
// No rewards, leaderboards, points, badges, or multi-level referrals
// Focus: reliable, secure, measurable invitation system
// Architecture: designed to expand in v1.5 without major restructuring

// ─── PRISMA SCHEMA ADDITIONS ─────────────────────────────────────────────────
// Add these two models to prisma/schema.prisma when running migrations:
//
// model ReferralCode {
//   id           String   @id @default(uuid()) @db.Uuid
//   user_id      String   @unique @db.Uuid          // one code per user, permanent
//   code         String   @unique @db.VarChar(12)   // e.g. "BC-X7K2M9"
//   clicks       Int      @default(0)
//   created_at   DateTime @default(now()) @db.Timestamptz
//   referrals    Referral[]
//   @@map("referral_code")
// }
//
// model Referral {
//   id               String    @id @default(uuid()) @db.Uuid
//   referral_code_id String    @db.Uuid
//   referred_user_id String?   @unique @db.Uuid    // set when account created
//   status           String    @default("clicked")  // clicked|registered|verified
//   ip_fingerprint   String?   @db.VarChar(64)     // for abuse detection (hashed)
//   source           String?   @db.VarChar(50)     // whatsapp|email|sms|facebook|x|telegram|copy
//   created_at       DateTime  @default(now()) @db.Timestamptz
//   verified_at      DateTime? @db.Timestamptz     // set when referred user verifies email
//   code             ReferralCode @relation(fields: [referral_code_id], references: [id])
//   @@index([referral_code_id])
//   @@index([status])
//   @@map("referral")
// }

// ─── APPLICATION TYPES ────────────────────────────────────────────────────────

export type ReferralCode = {
  id:         string
  user_id:    string
  code:       string        // e.g. "BC-X7K2M9"
  clicks:     number
  created_at: string
}

export type ReferralStatus = 'clicked' | 'registered' | 'verified'

export type Referral = {
  id:               string
  referral_code_id: string
  referred_user_id: string | null
  status:           ReferralStatus
  source:           ShareSource | null
  created_at:       string
  verified_at:      string | null
}

export type ShareSource =
  | 'whatsapp'
  | 'email'
  | 'sms'
  | 'facebook'
  | 'x'
  | 'telegram'
  | 'copy'
  | 'native'

// What the user sees in their dashboard
export type ReferralDashboard = {
  code:          string                          // e.g. "BC-X7K2M9"
  link:          string                          // full URL
  clicks:        number                          // link clicks
  pending:       number                          // registered but not verified
  successful:    number                          // fully verified referrals
  total_invited: number                          // total distinct clicks/shares
  // Privacy: only anonymous status shown, no personal data about referred users
  recent: { status: ReferralStatus; created_at: string; source: string | null }[]
}

// Admin analytics — no personal data
export type ReferralAnalytics = {
  total_codes_generated:    number
  total_clicks:             number
  total_registered:         number
  total_verified:           number
  click_through_rate:       number    // registered / clicks
  conversion_rate:          number    // verified / registered
  top_sources:              { source: string; count: number }[]
  by_month:                 { month: string; clicks: number; registered: number; verified: number }[]
}

// Share message content
export type ShareContent = {
  url:     string
  title:   string
  message: string
}

export function buildShareContent(code: string, appUrl: string): ShareContent {
  const url     = `${appUrl}/invite/${code}`
  const title   = 'Join me on Kingdom Companion'
  const message = `I use Kingdom Companion to read Scripture, receive daily encouragement, and grow in faith. It's completely free. Come join me! 🙏 ${url}`
  return { url, title, message }
}

// Share channel configurations
export type ShareChannel = {
  id:       ShareSource
  label:    string
  icon:     string
  color:    string
  getUrl:   (content: ShareContent) => string | null  // null = use native/copy
}

export const SHARE_CHANNELS: ShareChannel[] = [
  {
    id: 'whatsapp', label: 'WhatsApp', icon: '💬', color: '#25D366',
    getUrl: ({ message }) =>
      `https://wa.me/?text=${encodeURIComponent(message)}`,
  },
  {
    id: 'email', label: 'Email', icon: '✉️', color: '#1B3A5C',
    getUrl: ({ url, title, message }) =>
      `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(message)}`,
  },
  {
    id: 'sms', label: 'SMS', icon: '📱', color: '#34C759',
    getUrl: ({ message }) =>
      `sms:?body=${encodeURIComponent(message)}`,
  },
  {
    id: 'facebook', label: 'Facebook', icon: '👥', color: '#1877F2',
    getUrl: ({ url }) =>
      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
  },
  {
    id: 'x', label: 'X (Twitter)', icon: '𝕏', color: '#000000',
    getUrl: ({ message }) =>
      `https://x.com/intent/tweet?text=${encodeURIComponent(message)}`,
  },
  {
    id: 'telegram', label: 'Telegram', icon: '✈️', color: '#0088CC',
    getUrl: ({ url, message }) =>
      `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(message)}`,
  },
  {
    id: 'copy', label: 'Copy Link', icon: '🔗', color: '#C9A84C',
    getUrl: () => null,   // handled separately — copies to clipboard
  },
  {
    id: 'native', label: 'More', icon: '⬆️', color: '#7A9E87',
    getUrl: () => null,   // uses navigator.share
  },
]