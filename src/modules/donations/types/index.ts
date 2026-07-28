// ─── DONATION TYPES — KINGDOM COMPANION ──────────────────────────────────────
// PRD §4.61: Donations voluntary, never restricts access to Scripture
// Constitution §4: Never pressure users, never interrupt Bible reading
// Global coverage: North America, Europe, Africa, Asia, Latin America

export type DonationAmount = 5 | 10 | 25 | 50 | 100
export const PRESET_AMOUNTS: DonationAmount[] = [5, 10, 25, 50, 100]
export type DonationFrequency = 'one_time' | 'monthly' | 'annual'
export type DonationCurrency = 'USD' | 'GBP' | 'EUR' | 'CAD' | 'AUD' | 'NGN' | 'ZAR' | 'KES' | 'GHS' | 'INR' | 'PHP' | 'BRL'

export type DonationRecord = {
  id:              string
  payment_provider: 'stripe' | 'paypal' | 'flutterwave' | 'paystack' | 'razorpay'
  provider_ref:    string
  amount_cents:    number
  currency:        DonationCurrency
  frequency:       DonationFrequency
  status:          'pending' | 'succeeded' | 'failed' | 'refunded'
  donor_email?:    string
  created_at:      string
  updated_at:      string
}

export type DonationSummary = {
  total_amount_cents:   number
  total_count:          number
  average_amount_cents: number
  this_month_cents:     number
  this_month_count:     number
  by_month:             { month: string; amount_cents: number; count: number }[]
  recent:               { amount_cents: number; currency: string; status: string; created_at: string }[]
}

export const DONATION_USES = [
  { icon: '🌐', label: 'Server hosting & infrastructure'  },
  { icon: '📖', label: 'Bible API licensing costs'         },
  { icon: '🤖', label: 'AI service costs'                  },
  { icon: '🔒', label: 'Security improvements'             },
  { icon: '♿', label: 'Accessibility enhancements'        },
  { icon: '📚', label: 'New devotionals & content'        },
  { icon: '🌍', label: 'Global ministry reach'             },
  { icon: '🛠️', label: 'Ongoing development'              },
]

export const CURRENCY_CONFIG: Record<DonationCurrency, { symbol: string; name: string; presets: number[] }> = {
  USD: { symbol: '$',   name: 'US Dollar',         presets: [5,10,25,50,100]           },
  GBP: { symbol: '£',   name: 'British Pound',      presets: [5,10,20,50,100]           },
  EUR: { symbol: '€',   name: 'Euro',               presets: [5,10,25,50,100]           },
  CAD: { symbol: 'C$',  name: 'Canadian Dollar',    presets: [5,10,25,50,100]           },
  AUD: { symbol: 'A$',  name: 'Australian Dollar',  presets: [5,10,25,50,100]           },
  NGN: { symbol: '₦',   name: 'Nigerian Naira',     presets: [500,1000,2500,5000,10000] },
  ZAR: { symbol: 'R',   name: 'South African Rand', presets: [50,100,250,500,1000]      },
  KES: { symbol: 'KSh', name: 'Kenyan Shilling',    presets: [500,1000,2500,5000,10000] },
  GHS: { symbol: '₵',   name: 'Ghanaian Cedi',      presets: [20,50,100,200,500]        },
  INR: { symbol: '₹',   name: 'Indian Rupee',       presets: [100,250,500,1000,2500]    },
  PHP: { symbol: '₱',   name: 'Philippine Peso',    presets: [100,250,500,1000,2500]    },
  BRL: { symbol: 'R$',  name: 'Brazilian Real',     presets: [10,25,50,100,250]         },
}
// ─── FREQUENCY (extended per master prompt spec) ─────────────────────────────
export type DonationFrequencyFull = 'one_time' | 'monthly' | 'quarterly' | 'annual'
export const FREQUENCY_LABELS: Record<DonationFrequencyFull, string> = {
  one_time:  'One-time',
  monthly:   'Monthly',
  quarterly: 'Quarterly',
  annual:    'Annually',
}

// ─── DEDICATION ────────────────────────────────────────────────────────────────
export type DedicationType =
  | 'memory' | 'thanksgiving' | 'prayer_support' | 'mission_support'
  | 'general_ministry' | 'bible_translation' | 'app_development'
  | 'childrens_ministry' | 'where_needed_most'

export const DEDICATION_OPTIONS: { id: DedicationType; label: string; needsName: boolean }[] = [
  { id: 'where_needed_most',  label: 'Where needed most',       needsName: false },
  { id: 'general_ministry',   label: 'General ministry',         needsName: false },
  { id: 'bible_translation',  label: 'Bible translation',        needsName: false },
  { id: 'app_development',    label: 'App development',          needsName: false },
  { id: 'childrens_ministry', label: "Children's ministry",      needsName: false },
  { id: 'mission_support',    label: 'Mission support',          needsName: false },
  { id: 'prayer_support',     label: 'Prayer support',           needsName: false },
  { id: 'memory',             label: 'In memory of...',          needsName: true  },
  { id: 'thanksgiving',       label: 'In thanksgiving for...',   needsName: true  },
]

// ─── DONOR PREFERENCES ────────────────────────────────────────────────────────
export type DonorPreferences = {
  donor_display_name: string
  is_anonymous:       boolean
  hide_amount:        boolean
  wants_receipt:      boolean
  wants_updates:      boolean
  donor_email:        string
}

export const DEFAULT_DONOR_PREFERENCES: DonorPreferences = {
  donor_display_name: '',
  is_anonymous:        false,
  hide_amount:         false,
  wants_receipt:       true,
  wants_updates:        false,
  donor_email:         '',
}

// ─── PAYMENT METHODS — HONEST CAPABILITY MAP ─────────────────────────────────
export type PaymentMethodStatus = 'live' | 'requires_account'

export type PaymentMethod = {
  id:          string
  label:       string
  icon:        string
  provider:    'stripe' | 'paypal' | 'flutterwave' | 'paystack' | 'razorpay' | 'mercadopago' | 'alipay' | 'wechat' | 'crypto'
  status:      PaymentMethodStatus
  regions:     string[]
}

export const PAYMENT_METHODS: PaymentMethod[] = [
  { id: 'card',          label: 'Credit / Debit Card', icon: '💳', provider: 'stripe',      status: 'live',              regions: [] },
  { id: 'apple_pay',     label: 'Apple Pay',           icon: '',  provider: 'stripe',      status: 'live',              regions: [] },
  { id: 'google_pay',    label: 'Google Pay',          icon: '🅖', provider: 'stripe',      status: 'live',              regions: [] },
  { id: 'ach',           label: 'Bank Transfer (ACH)', icon: '🏦', provider: 'stripe',      status: 'live',              regions: ['US'] },
  { id: 'sepa',          label: 'SEPA Bank Transfer',  icon: '🏦', provider: 'stripe',      status: 'live',              regions: ['DE','FR','ES','IT','NL','BE','AT','IE','PT','FI'] },
  { id: 'ideal',         label: 'iDEAL',               icon: '🏦', provider: 'stripe',      status: 'live',              regions: ['NL'] },
  { id: 'bancontact',    label: 'Bancontact',          icon: '🏦', provider: 'stripe',      status: 'live',              regions: ['BE'] },
  { id: 'paypal',        label: 'PayPal',              icon: '🅿️', provider: 'paypal',      status: 'live',              regions: [] },
  { id: 'flutterwave',   label: 'Flutterwave',         icon: '🌍', provider: 'flutterwave', status: 'requires_account',  regions: ['NG','GH','KE','ZA','UG','TZ','RW'] },
  { id: 'paystack',      label: 'Paystack',            icon: '🌍', provider: 'paystack',    status: 'requires_account',  regions: ['NG','GH','ZA','KE'] },
  { id: 'razorpay',      label: 'Razorpay / UPI',      icon: '🇮🇳', provider: 'razorpay',    status: 'requires_account',  regions: ['IN'] },
  { id: 'mercadopago',   label: 'Mercado Pago / PIX',  icon: '🇧🇷', provider: 'mercadopago', status: 'requires_account',  regions: ['BR','MX','AR','CO'] },
  { id: 'alipay',        label: 'Alipay',              icon: '🇨🇳', provider: 'alipay',      status: 'requires_account',  regions: ['CN'] },
  { id: 'wechat',        label: 'WeChat Pay',          icon: '🇨🇳', provider: 'wechat',      status: 'requires_account',  regions: ['CN'] },
  { id: 'crypto',        label: 'Cryptocurrency',      icon: '₿',  provider: 'crypto',      status: 'requires_account',  regions: [] },
]

export function getSuggestedMethodOrder(countryCode: string | null): PaymentMethod[] {
  if (!countryCode) return PAYMENT_METHODS.filter(m => m.status === 'live')
  const regional = PAYMENT_METHODS.filter(m => m.regions.includes(countryCode))
  const globalLive = PAYMENT_METHODS.filter(m => m.status === 'live' && m.regions.length === 0)
  const rest = PAYMENT_METHODS.filter(m => !regional.includes(m) && !globalLive.includes(m))
  return [...regional, ...globalLive, ...rest]
}

// ─── CURRENCY BY COUNTRY (for smart default display) ─────────────────────────
export const COUNTRY_CURRENCY: Record<string, DonationCurrency> = {
  US: 'USD', GB: 'GBP', CA: 'CAD', AU: 'AUD',
  NG: 'NGN', ZA: 'ZAR', KE: 'KES', GH: 'GHS',
  IN: 'INR', PH: 'PHP', BR: 'BRL',
  DE: 'EUR', FR: 'EUR', ES: 'EUR', IT: 'EUR', NL: 'EUR', BE: 'EUR', AT: 'EUR', IE: 'EUR', PT: 'EUR', FI: 'EUR',
}
