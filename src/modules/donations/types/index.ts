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