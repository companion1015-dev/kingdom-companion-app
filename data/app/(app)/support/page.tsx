'use client'
import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Heart, Shield, Check, Share2, ExternalLink, ChevronRight } from 'lucide-react'
import Navigation from '@/components/layout/Navigation'
import Footer from '@/components/layout/Footer'
import { PRESET_AMOUNTS, DONATION_USES } from '@/modules/donations/types'
import type { DonationCurrency } from '@/modules/donations/types'

type Step = 'amount' | 'payment' | 'success'

const CURRENCIES: { code: DonationCurrency; symbol: string; label: string }[] = [
  { code: 'USD', symbol: '$', label: 'US Dollar'       },
  { code: 'GBP', symbol: '£', label: 'British Pound'   },
  { code: 'EUR', symbol: '€', label: 'Euro'             },
  { code: 'CAD', symbol: 'C$',label: 'Canadian Dollar' },
  { code: 'AUD', symbol: 'A$',label: 'Australian Dollar'},
]

export default function SupportPage() {
  const [step,        setStep]        = useState<Step>('amount')
  const [selected,    setSelected]    = useState<number | null>(null)
  const [custom,      setCustom]      = useState('')
  const [currency,    setCurrency]    = useState<DonationCurrency>('USD')
  const [loading,     setLoading]     = useState(false)
  const [error,       setError]       = useState<string | null>(null)
  const [demoMode,    setDemoMode]    = useState(false)
  const [shared,      setShared]      = useState(false)

  const currencyObj = CURRENCIES.find(c => c.code === currency) ?? CURRENCIES[0]
  const amount      = custom ? parseFloat(custom) : (selected ?? 0)
  const amountCents = Math.round(amount * 100)
  const isValid     = amount >= 1 && amount <= 10000 && !isNaN(amount)

  const handleAmountSelect = (a: number) => {
    setSelected(a)
    setCustom('')
    setError(null)
  }

  const handleCustomChange = (val: string) => {
    setCustom(val)
    setSelected(null)
    setError(null)
  }

  const handleProceed = async () => {
    if (!isValid) {
      setError('Please enter a valid amount between $1 and $10,000.')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const res  = await fetch('/api/v1/donations/create-intent', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ amount_cents: amountCents, currency, frequency: 'one_time' }),
      })
      const data = await res.json()

      if (!data.success) {
        setError(data.error?.message ?? 'Something went wrong. Please try again.')
        return
      }

      if (data.data?.demo_mode) {
        setDemoMode(true)
      }

      // In production: initialise Stripe Elements with client_secret
      // For now: proceed to payment step (Stripe integration shown in payment card)
      setStep('payment')

    } catch {
      setError('Network error. Please check your connection and try again.')
    } finally {
      setLoading(false)
    }
  }

  const handlePaymentComplete = () => {
    setStep('success')
  }

  const handleShare = async () => {
    const text = 'I\'m supporting Kingdom Companion — a free, Scripture-centred app. Join me! 🙏'
    try {
      if (navigator.share) {
        await navigator.share({ title: 'Support Kingdom Companion', text, url: window.location.origin })
      } else {
        await navigator.clipboard.writeText(`${text} ${window.location.origin}`)
      }
      setShared(true)
    } catch { /* user cancelled */ }
  }

  return (
    <>
      <Navigation />
      <main className="min-h-screen bg-cream pt-16">

        {/* Hero */}
        <div className="bg-hero-gradient relative overflow-hidden">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full opacity-[0.06]"
            style={{ background: 'radial-gradient(circle, #C9A84C 0%, transparent 70%)' }}
          />
          <div className="relative max-w-3xl mx-auto px-4 sm:px-6 py-14 text-center">
            <div className="relative w-16 h-16 rounded-2xl overflow-hidden mx-auto mb-5 shadow-lg">
              <Image src="/images/logo.png" alt="Kingdom Companion" fill className="object-cover" sizes="64px" />
            </div>
            <h1 className="font-display text-3xl sm:text-4xl font-light text-white mb-3">
              Support Kingdom Companion
            </h1>
            <p className="text-white/60 font-body text-base leading-relaxed max-w-xl mx-auto">
              Thank you for using Kingdom Companion. Your optional donation helps us maintain the app,
              improve AI features, keep servers running, develop new features, and make God&rsquo;s Word
              more accessible worldwide.
            </p>

            {/* Constitution §4 — always voluntary, never pressuring */}
            <div className="mt-5 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/8 border border-white/12">
              <Heart className="w-3.5 h-3.5 text-gold" />
              <span className="text-white/60 font-body text-xs">Always voluntary — Bible access is always free</span>
            </div>
          </div>
        </div>

        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10">

          {/* Step: Amount selection */}
          {step === 'amount' && (
            <div className="space-y-5">

              {/* Currency selector */}
              <div className="bg-white rounded-2xl border border-navy/8 p-5">
                <label className="block text-xs font-body font-semibold text-navy/40 tracking-widest uppercase mb-3">
                  Currency
                </label>
                <div className="flex flex-wrap gap-2">
                  {CURRENCIES.map(c => (
                    <button
                      key={c.code}
                      onClick={() => setCurrency(c.code)}
                      className={`px-3 py-1.5 rounded-full border text-xs font-body font-medium transition-all ${
                        currency === c.code
                          ? 'bg-navy text-white border-navy'
                          : 'border-navy/12 text-charcoal/55 hover:border-navy/30 hover:text-navy'
                      }`}
                    >
                      {c.symbol} {c.code}
                    </button>
                  ))}
                </div>
              </div>

              {/* Amount selection */}
              <div className="bg-white rounded-2xl border border-navy/8 p-5">
                <label className="block text-xs font-body font-semibold text-navy/40 tracking-widest uppercase mb-4">
                  Choose Amount
                </label>

                {/* Preset amounts */}
                <div className="grid grid-cols-5 gap-2 mb-4">
                  {PRESET_AMOUNTS.map(a => (
                    <button
                      key={a}
                      onClick={() => handleAmountSelect(a)}
                      className={`py-3 rounded-xl border text-sm font-body font-semibold transition-all ${
                        selected === a
                          ? 'bg-navy text-white border-navy shadow-md shadow-navy/20'
                          : 'border-navy/12 text-navy/70 hover:border-navy/30 hover:bg-navy/4'
                      }`}
                    >
                      {currencyObj.symbol}{a}
                    </button>
                  ))}
                </div>

                {/* Custom amount */}
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-charcoal/40 font-body text-sm font-semibold">
                    {currencyObj.symbol}
                  </span>
                  <input
                    type="number"
                    value={custom}
                    onChange={e => handleCustomChange(e.target.value)}
                    placeholder="Custom amount"
                    min="1"
                    max="10000"
                    step="0.01"
                    className="w-full pl-8 pr-4 py-3 rounded-xl border border-navy/12 focus:border-gold/40 focus:ring-2 focus:ring-gold/10 text-navy font-body text-sm outline-none transition-all"
                  />
                </div>

                {error && (
                  <p className="text-red-500 font-body text-xs mt-2">{error}</p>
                )}

                {/* Amount display */}
                {isValid && (
                  <div className="mt-4 p-3 bg-cream rounded-xl text-center">
                    <p className="text-xs text-charcoal/40 font-body mb-0.5">One-time donation</p>
                    <p className="font-display text-2xl font-light text-navy">
                      {currencyObj.symbol}{amount.toFixed(2)} <span className="text-sm text-charcoal/40">{currency}</span>
                    </p>
                  </div>
                )}

                {/* Proceed button */}
                <button
                  onClick={handleProceed}
                  disabled={!isValid || loading}
                  className={`
                    w-full mt-4 flex items-center justify-center gap-2 py-4 rounded-2xl
                    text-sm font-body font-semibold transition-all duration-200
                    ${isValid && !loading
                      ? 'bg-navy hover:bg-navy-light text-white shadow-lg shadow-navy/20 hover:scale-[1.01]'
                      : 'bg-charcoal/8 text-charcoal/30 cursor-not-allowed'
                    }
                  `}
                >
                  {loading
                    ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    : <Heart className="w-4 h-4" />
                  }
                  {loading ? 'Preparing…' : `Continue with ${currencyObj.symbol}${amount > 0 ? amount.toFixed(2) : '0.00'}`}
                </button>
              </div>

              {/* What donations fund */}
              <div className="bg-white rounded-2xl border border-navy/8 p-6">
                <h2 className="font-display text-lg font-semibold text-navy mb-4">How your donation helps</h2>
                <div className="grid grid-cols-2 gap-3">
                  {DONATION_USES.map(({ icon, label }) => (
                    <div key={label} className="flex items-center gap-2.5 p-3 bg-cream rounded-xl">
                      <span className="text-lg">{icon}</span>
                      <span className="text-xs font-body text-charcoal/65 leading-snug">{label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* PayPal alternative */}
              <div className="bg-white rounded-2xl border border-navy/8 p-5">
                <h3 className="font-body text-sm font-semibold text-navy mb-3">Alternative payment methods</h3>
                <a
                  href="https://paypal.me/kingdomcompanion"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-4 rounded-xl bg-[#003087]/5 border border-[#003087]/10 hover:border-[#003087]/25 transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#003087] flex items-center justify-center">
                      <span className="text-white font-bold text-xs">PP</span>
                    </div>
                    <div>
                      <p className="text-sm font-body font-semibold text-navy">Donate via PayPal</p>
                      <p className="text-xs text-charcoal/40 font-body">Secure PayPal donation</p>
                    </div>
                  </div>
                  <ExternalLink className="w-4 h-4 text-charcoal/30 group-hover:text-navy transition-colors" />
                </a>
              </div>

              {/* Security note */}
              <div className="flex items-center gap-3 p-4 rounded-xl bg-green-50 border border-green-100">
                <Shield className="w-5 h-5 text-green-600 shrink-0" />
                <div>
                  <p className="text-xs font-body font-semibold text-green-700 mb-0.5">Secure payment</p>
                  <p className="text-xs font-body text-green-600 leading-relaxed">
                    All payments are processed securely by Stripe. Kingdom Companion never stores your card details.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Step: Payment */}
          {step === 'payment' && (
            <div className="bg-white rounded-2xl border border-navy/8 overflow-hidden">
              {/* Amount summary */}
              <div className="p-6 border-b border-navy/8 bg-cream/50">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-charcoal/40 font-body tracking-wider uppercase mb-1">Donating</p>
                    <p className="font-display text-3xl font-light text-navy">
                      {currencyObj.symbol}{amount.toFixed(2)}
                    </p>
                  </div>
                  <button
                    onClick={() => setStep('amount')}
                    className="text-xs text-gold hover:text-gold-dark font-body font-medium transition-colors"
                  >
                    Change amount
                  </button>
                </div>
              </div>

              <div className="p-6">
                {demoMode && (
                  <div className="mb-5 p-4 rounded-xl bg-amber-50 border border-amber-100">
                    <p className="text-xs font-body font-semibold text-amber-700 mb-1">Demo Mode</p>
                    <p className="text-xs font-body text-amber-600 leading-relaxed">
                      Stripe is not yet configured. Add <code className="bg-amber-100 px-1 rounded">STRIPE_SECRET_KEY</code> and{' '}
                      <code className="bg-amber-100 px-1 rounded">NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY</code> to your environment variables to enable live payments.
                    </p>
                  </div>
                )}

                {/* Stripe Elements placeholder */}
                {/* In production: <Elements stripe={stripePromise}><PaymentElement /></Elements> */}
                <div className="space-y-4 mb-6">
                  <div>
                    <label className="block text-xs font-body font-semibold text-navy/40 tracking-wider uppercase mb-2">Card number</label>
                    <div className="p-3.5 rounded-xl border border-navy/12 bg-navy/2 text-charcoal/35 font-body text-sm">
                      {demoMode ? '•••• •••• •••• •••• (Demo)' : 'Card form loads here (Stripe Elements)'}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-body font-semibold text-navy/40 tracking-wider uppercase mb-2">Expiry</label>
                      <div className="p-3.5 rounded-xl border border-navy/12 bg-navy/2 text-charcoal/35 font-body text-sm">MM / YY</div>
                    </div>
                    <div>
                      <label className="block text-xs font-body font-semibold text-navy/40 tracking-wider uppercase mb-2">CVC</label>
                      <div className="p-3.5 rounded-xl border border-navy/12 bg-navy/2 text-charcoal/35 font-body text-sm">•••</div>
                    </div>
                  </div>
                </div>

                <button
                  onClick={handlePaymentComplete}
                  className="w-full flex items-center justify-center gap-2 py-4 bg-navy hover:bg-navy-light text-white text-sm font-body font-semibold rounded-2xl transition-all hover:scale-[1.01] shadow-lg shadow-navy/20"
                >
                  <Heart className="w-4 h-4" />
                  {demoMode ? 'Complete Demo Donation' : `Donate ${currencyObj.symbol}${amount.toFixed(2)}`}
                </button>

                <div className="flex items-center justify-center gap-2 mt-4">
                  <Shield className="w-3.5 h-3.5 text-charcoal/30" />
                  <p className="text-xs text-charcoal/30 font-body">Secured by Stripe · No card data stored</p>
                </div>
              </div>
            </div>
          )}

          {/* Step: Success */}
          {step === 'success' && (
            <div className="text-center">
              {/* Success animation */}
              <div
                className="w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl"
                style={{ background: 'linear-gradient(135deg, #1B3A5C 0%, #2A5080 100%)' }}
              >
                <Heart className="w-10 h-10 text-gold fill-current" />
              </div>

              <h2 className="font-display text-3xl font-light text-navy mb-3">
                Thank You!
              </h2>
              <p className="text-charcoal/60 font-body text-base leading-relaxed mb-2 max-w-md mx-auto">
                Thank you for supporting Kingdom Companion. Your generosity helps us continue improving
                the app and making God&rsquo;s Word accessible to more people around the world.
              </p>

              {/* Scripture response */}
              <div className="my-8 p-6 bg-white rounded-2xl border border-navy/8 max-w-md mx-auto text-left">
                <p className="font-display italic text-navy text-lg leading-relaxed mb-3">
                  &ldquo;Each of you should give what you have decided in your heart to give,
                  not reluctantly or under compulsion, for God loves a cheerful giver.&rdquo;
                </p>
                <p className="text-gold text-sm font-body font-semibold">— 2 Corinthians 9:7 (NIV)</p>
              </div>

              {/* Share option — Constitution §4: voluntary, no amount revealed */}
              <div className="mb-8">
                <p className="text-xs text-charcoal/40 font-body mb-3">
                  Let others know you support this ministry? (No amounts shared)
                </p>
                <button
                  onClick={handleShare}
                  className={`inline-flex items-center gap-2 px-6 py-3 rounded-full border text-sm font-body font-medium transition-all ${
                    shared
                      ? 'border-green-200 bg-green-50 text-green-700'
                      : 'border-navy/15 text-navy/70 hover:border-navy/30 hover:text-navy'
                  }`}
                >
                  {shared ? <><Check className="w-4 h-4" /> Shared!</> : <><Share2 className="w-4 h-4" /> Share your support</>}
                </button>
              </div>

              {/* Next steps */}
              <div className="grid sm:grid-cols-2 gap-3 max-w-md mx-auto">
                <Link
                  href="/bible"
                  className="flex items-center gap-3 p-4 bg-white rounded-2xl border border-navy/8 hover:border-gold/20 transition-all text-left group"
                >
                  <span className="text-xl">📖</span>
                  <div>
                    <p className="text-sm font-body font-semibold text-navy">Read the Bible</p>
                    <p className="text-xs text-charcoal/40 font-body">Continue your reading</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-navy/20 group-hover:text-gold ml-auto transition-colors" />
                </Link>
                <Link
                  href="/companion"
                  className="flex items-center gap-3 p-4 bg-white rounded-2xl border border-navy/8 hover:border-gold/20 transition-all text-left group"
                >
                  <span className="text-xl">✨</span>
                  <div>
                    <p className="text-sm font-body font-semibold text-navy">AI Companion</p>
                    <p className="text-xs text-charcoal/40 font-body">Get encouragement</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-navy/20 group-hover:text-gold ml-auto transition-colors" />
                </Link>
              </div>

              <Link
                href="/"
                className="inline-flex items-center gap-2 mt-8 text-sm text-charcoal/40 hover:text-navy font-body transition-colors"
              >
                ← Back to home
              </Link>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  )
}
