'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { Heart, BookOpen, MessageCircle, ArrowRight } from 'lucide-react'

// Real fix: this folder existed empty since early in the project -- a
// referral link would 404. Tracks the click for real (POST to
// /api/v1/referrals/track), stores the code so /register can credit the
// referral once the visitor actually signs up, and gives a warm,
// non-pressuring welcome rather than a generic landing page.

const FEATURES = [
  { icon: BookOpen,     label: 'Read the full Bible, always free' },
  { icon: MessageCircle,label: 'A caring AI Companion for whatever you\u2019re facing' },
  { icon: Heart,        label: 'A global Prayer Wall to pray with others' },
]

export default function InviteLandingPage() {
  const params = useParams()
  const router = useRouter()
  const code = typeof params.code === 'string' ? params.code : Array.isArray(params.code) ? params.code[0] : ''
  const [tracked, setTracked] = useState(false)

  useEffect(() => {
    if (!code || tracked) return
    setTracked(true)
    try { localStorage.setItem('kc_referral_code', code) } catch { /* storage unavailable */ }
    fetch('/api/v1/referrals/track', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, event: 'click' }),
    }).catch(() => { /* tracking is a nice-to-have, never block the visitor */ })
  }, [code, tracked])

  const handleJoin = () => router.push(`/register?ref=${encodeURIComponent(code)}`)

  return (
    <div className="min-h-screen bg-hero-gradient flex flex-col">
      <main className="flex-1 flex items-center justify-center px-4 py-16">
        <div className="max-w-md w-full text-center">
          <div className="relative w-16 h-16 rounded-2xl overflow-hidden mx-auto mb-6 shadow-lg">
            <Image src="/images/logo.png" alt="Kingdom Companion" fill className="object-cover" sizes="64px" />
          </div>

          <h1 className="font-display text-3xl sm:text-4xl font-light text-white mb-3">
            You&rsquo;ve been invited to<br /><span className="italic gold-text">Kingdom Companion</span>
          </h1>
          <p className="text-white/60 font-body text-base leading-relaxed mb-10">
            A friend thought you might find encouragement here. It&rsquo;s a free, Scripture-centred space to read, pray, and grow — no pressure, no cost, ever.
          </p>

          <div className="space-y-3 mb-10 text-left">
            {FEATURES.map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-3 glass rounded-2xl px-4 py-3.5">
                <Icon className="w-4 h-4 text-gold shrink-0" />
                <span className="text-white/75 font-body text-sm">{label}</span>
              </div>
            ))}
          </div>

          <button onClick={handleJoin}
            className="w-full flex items-center justify-center gap-2 px-6 py-4 rounded-2xl bg-gold hover:bg-gold-light text-navy dark:text-cream text-sm font-body font-semibold shadow-lg shadow-gold/20 hover:scale-[1.01] transition-all mb-4">
            Join Kingdom Companion <ArrowRight className="w-4 h-4" />
          </button>

          <Link href="/" className="text-white/40 hover:text-white/60 font-body text-xs transition-colors">
            Or just explore first, no account needed →
          </Link>
        </div>
      </main>
    </div>
  )
}