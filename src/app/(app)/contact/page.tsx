'use client'
import { useState } from 'react'
import { Mail, Send, Check } from 'lucide-react'
import Navigation from '@/components/layout/Navigation'
import Footer from '@/components/layout/Footer'

// Real fix: the footer has linked to /contact since early in this project,
// but the page never existed -- a genuine 404. This is a real, working
// form backed by /api/v1/feedback (which saves to the Feedback table that
// already existed in the schema but had no route using it).

const TYPES = ['General Feedback', 'Bug Report', 'Feature Request'] as const

export default function ContactPage() {
  const [type,    setType]    = useState<typeof TYPES[number]>('General Feedback')
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState<string | null>(null)
  const [sent,    setSent]    = useState(false)

  const handleSubmit = async () => {
    if (!subject.trim() || !message.trim()) {
      setError('Please fill in both the subject and message.')
      return
    }
    setLoading(true); setError(null)
    try {
      const res  = await fetch('/api/v1/feedback', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ feedback_type: type, subject, message }),
      })
      const data = await res.json()
      if (data.success) setSent(true)
      else setError(data.error?.message ?? 'Something went wrong. Please try again.')
    } catch {
      setError('Network error. Please check your connection and try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-cream-gradient">
      <Navigation />
      <main className="max-w-2xl mx-auto px-4 py-10">
        <div className="flex items-center gap-3 mb-2">
          <Mail className="w-7 h-7 text-navy" />
          <h1 className="text-3xl font-serif text-navy">Contact Us</h1>
        </div>
        <p className="text-navy/60 mb-8">
          Have a question, found a bug, or want to suggest something? We&rsquo;d genuinely love to hear from you.
        </p>

        {sent ? (
          <div className="bg-white rounded-2xl border border-navy/8 p-8 text-center">
            <div className="w-14 h-14 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-4">
              <Check className="w-6 h-6 text-green-600" />
            </div>
            <h2 className="font-display text-xl font-semibold text-navy mb-2">Message sent</h2>
            <p className="text-charcoal/55 font-body text-sm">
              Thank you for reaching out — we read every message and will get back to you where a reply is needed.
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-navy/8 p-6 sm:p-8 space-y-4">
            {error && <p className="text-xs font-body text-red-600 bg-red-50 border border-red-100 rounded-xl p-3">{error}</p>}

            <div>
              <label className="block text-xs font-body font-semibold text-navy/50 tracking-wider uppercase mb-1.5">Type</label>
              <div className="flex gap-2">
                {TYPES.map(t => (
                  <button key={t} onClick={() => setType(t)}
                    className={`px-3 py-1.5 rounded-full border text-xs font-body font-medium transition-all ${type === t ? 'bg-navy text-white border-navy' : 'border-navy/12 text-charcoal/55 hover:border-navy/30'}`}>
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-body font-semibold text-navy/50 tracking-wider uppercase mb-1.5">Subject</label>
              <input value={subject} onChange={e => setSubject(e.target.value)} maxLength={255}
                placeholder="A short summary of your message"
                className="w-full px-4 py-2.5 rounded-xl border border-navy/12 focus:border-gold/40 focus:ring-2 focus:ring-gold/10 text-navy font-body text-sm outline-none transition-all" />
            </div>

            <div>
              <label className="block text-xs font-body font-semibold text-navy/50 tracking-wider uppercase mb-1.5">Message</label>
              <textarea value={message} onChange={e => setMessage(e.target.value)} rows={6} maxLength={2000}
                placeholder="Tell us what's on your mind…"
                className="w-full px-4 py-3 rounded-xl border border-navy/12 focus:border-gold/40 focus:ring-2 focus:ring-gold/10 text-navy font-body text-sm outline-none resize-none transition-all" />
              <p className="text-xs text-charcoal/30 font-body mt-1 text-right">{message.length}/2000</p>
            </div>

            <button onClick={handleSubmit} disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3.5 bg-navy hover:bg-navy-light text-white text-sm font-body font-semibold rounded-2xl transition-all disabled:opacity-50">
              {loading ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Send className="w-4 h-4" />}
              Send Message
            </button>
          </div>
        )}
      </main>
      <Footer />
    </div>
  )
}