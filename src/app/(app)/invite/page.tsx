'use client'
import { useState, useEffect } from 'react'
import { Users, Copy, Check, TrendingUp, UserPlus, ShieldCheck } from 'lucide-react'
import Navigation from '@/components/layout/Navigation'
import Footer from '@/components/layout/Footer'
import { SHARE_CHANNELS } from '@/modules/referrals/types'
import type { ReferralDashboard, ShareContent } from '@/modules/referrals/types'

export default function InviteDashboardPage() {
  const [data,    setData]    = useState<ReferralDashboard | null>(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState<string | null>(null)
  const [copied,  setCopied]  = useState(false)

  useEffect(() => {
    fetch('/api/v1/referrals/dashboard', { credentials: 'include' })
      .then(async res => {
        if (res.status === 401) { setError('Please sign in to get your invite link.'); return }
        const data = await res.json()
        if (data.success) setData(data.data)
        else setError(data.error?.message ?? 'Unable to load your invite link.')
      })
      .catch(() => setError('Network error. Please try again.'))
      .finally(() => setLoading(false))
  }, [])

  const shareContent: ShareContent | null = data
    ? { url: data.link, title: 'Join me on Kingdom Companion', message: `I use Kingdom Companion to read Scripture, receive daily encouragement, and grow in faith. It's completely free. Come join me! 🙏 ${data.link}` }
    : null

  const handleCopy = async () => {
    if (!data) return
    try {
      await navigator.clipboard.writeText(data.link)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch { /* clipboard unavailable */ }
  }

  const handleShare = (channelId: string) => {
    if (!shareContent) return
    const channel = SHARE_CHANNELS.find(c => c.id === channelId)
    if (!channel) return

    if (channelId === 'copy') { handleCopy(); return }
    if (channelId === 'native' && navigator.share) {
      navigator.share({ title: shareContent.title, text: shareContent.message, url: shareContent.url }).catch(() => {})
      return
    }
    const url = channel.getUrl(shareContent)
    if (url) window.open(url, '_blank', 'noopener,noreferrer')
  }

  return (
    <div className="min-h-screen bg-cream-gradient">
      <Navigation />
      <main className="max-w-2xl mx-auto px-4 py-10">
        <div className="flex items-center gap-3 mb-2">
          <Users className="w-7 h-7 text-navy" />
          <h1 className="text-3xl font-serif text-navy">Invite Friends</h1>
        </div>
        <p className="text-navy/60 mb-8">
          Share Kingdom Companion with someone who could use a little encouragement today. Always free, no strings attached.
        </p>

        {loading && (
          <div className="flex justify-center py-16">
            <div className="w-6 h-6 border-2 border-navy/20 border-t-navy rounded-full animate-spin" />
          </div>
        )}

        {!loading && error && (
          <div className="bg-white rounded-2xl border border-navy/8 p-8 text-center">
            <p className="text-charcoal/55 font-body text-sm">{error}</p>
          </div>
        )}

        {!loading && data && (
          <>
            {/* Your link */}
            <div className="bg-white rounded-2xl border border-navy/8 p-6 mb-5">
              <label className="block text-xs font-body font-semibold text-navy/40 tracking-widest uppercase mb-3">Your Invite Link</label>
              <div className="flex items-center gap-2">
                <div className="flex-1 px-4 py-3 rounded-xl bg-cream border border-navy/10 text-navy font-body text-sm truncate">
                  {data.link}
                </div>
                <button onClick={handleCopy}
                  className={`shrink-0 flex items-center gap-1.5 px-4 py-3 rounded-xl text-sm font-body font-semibold transition-all ${copied ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-navy hover:bg-navy-light text-white'}`}>
                  {copied ? <><Check className="w-4 h-4" /> Copied</> : <><Copy className="w-4 h-4" /> Copy</>}
                </button>
              </div>
            </div>

            {/* Share channels */}
            <div className="bg-white rounded-2xl border border-navy/8 p-6 mb-5">
              <label className="block text-xs font-body font-semibold text-navy/40 tracking-widest uppercase mb-3">Share Via</label>
              <div className="grid grid-cols-4 gap-3">
                {SHARE_CHANNELS.map(channel => (
                  <button key={channel.id} onClick={() => handleShare(channel.id)}
                    className="flex flex-col items-center gap-1.5 p-3 rounded-xl border border-navy/8 hover:border-gold/30 hover:bg-cream transition-all">
                    <span className="text-xl">{channel.icon}</span>
                    <span className="text-[10px] font-body text-charcoal/55 text-center leading-tight">{channel.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-3 mb-5">
              <div className="bg-white rounded-2xl border border-navy/8 p-4 text-center">
                <TrendingUp className="w-4 h-4 text-navy/40 mx-auto mb-1.5" />
                <p className="font-display text-2xl font-light text-navy">{data.clicks}</p>
                <p className="text-xs text-charcoal/45 font-body">Clicks</p>
              </div>
              <div className="bg-white rounded-2xl border border-navy/8 p-4 text-center">
                <UserPlus className="w-4 h-4 text-navy/40 mx-auto mb-1.5" />
                <p className="font-display text-2xl font-light text-navy">{data.pending}</p>
                <p className="text-xs text-charcoal/45 font-body">Joined</p>
              </div>
              <div className="bg-white rounded-2xl border border-navy/8 p-4 text-center">
                <ShieldCheck className="w-4 h-4 text-navy/40 mx-auto mb-1.5" />
                <p className="font-display text-2xl font-light text-navy">{data.successful}</p>
                <p className="text-xs text-charcoal/45 font-body">Verified</p>
              </div>
            </div>

            {/* Recent activity */}
            {data.recent.length > 0 && (
              <div className="bg-white rounded-2xl border border-navy/8 p-6">
                <label className="block text-xs font-body font-semibold text-navy/40 tracking-widest uppercase mb-3">Recent Activity</label>
                <div className="space-y-2">
                  {data.recent.map((r, i) => (
                    <div key={i} className="flex items-center justify-between py-2 border-b border-navy/6 last:border-0">
                      <span className="text-sm font-body text-charcoal/60 capitalize">
                        {r.status === 'verified' ? '✅ Someone joined and verified' : r.status === 'registered' ? '👋 Someone signed up' : '🔗 Link clicked'}
                        {r.source && <span className="text-charcoal/35"> via {r.source}</span>}
                      </span>
                      <span className="text-xs text-charcoal/30 font-body shrink-0">{new Date(r.created_at).toLocaleDateString()}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {data.recent.length === 0 && (
              <div className="bg-white rounded-2xl border border-navy/8 p-8 text-center">
                <p className="text-charcoal/45 font-body text-sm">No activity yet — share your link above to get started.</p>
              </div>
            )}
          </>
        )}
      </main>
      <Footer />
    </div>
  )
}