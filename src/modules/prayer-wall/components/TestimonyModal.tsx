'use client'
import { useState } from 'react'
import { X, Sparkles, Check } from 'lucide-react'
import { PRAISE_CATEGORIES } from '../types'
import { markAnswered } from '../services/prayer-service'

type Props = {
  requestId: string
  requestTitle: string
  onClose:   () => void
  onSuccess: () => void
}

// The Testimony feature — genuinely missing until now despite the backend
// (PrayerAnswered model, /answer and /praise routes) already existing.
// "When prayer is answered you share a testimony to strengthen others" --
// this is that front door.

export default function TestimonyModal({ requestId, requestTitle, onClose, onSuccess }: Props) {
  const [testimony,   setTestimony]   = useState('')
  const [bibleVerse,  setBibleVerse]  = useState('')
  const [thanksgiving,setThanksgiving]= useState('')
  const [category,    setCategory]    = useState('other')
  const [isPublic,    setIsPublic]    = useState(true)
  const [loading,     setLoading]     = useState(false)
  const [error,       setError]       = useState<string | null>(null)

  const handleSubmit = async () => {
    if (!testimony.trim() || testimony.trim().length < 20) {
      setError('Please share at least a few sentences about how God answered this prayer.')
      return
    }
    setLoading(true); setError(null)
    const ok = await markAnswered(requestId, {
      testimony: testimony.trim(),
      bible_verse: bibleVerse.trim() || undefined,
      thanksgiving: thanksgiving.trim() || undefined,
      praise_category: category,
      is_public: isPublic,
    })
    setLoading(false)
    if (ok) onSuccess()
    else setError('Something went wrong. Please try again.')
  }

  return (
    <>
      <div className="fixed inset-0 z-40 bg-navy/30 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed inset-x-3 bottom-0 sm:inset-auto sm:left-1/2 sm:-translate-x-1/2 sm:top-1/2 sm:-translate-y-1/2 sm:w-full sm:max-w-lg z-50 bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl shadow-navy/25 flex flex-col max-h-[92vh]"
        role="dialog" aria-modal="true" aria-label="Share your testimony">

        <div className="flex items-center justify-between px-6 py-5 border-b border-navy/8 shrink-0 bg-green-50/50">
          <div className="flex items-center gap-2.5">
            <Sparkles className="w-5 h-5 text-green-600" />
            <div>
              <h2 className="font-display text-lg font-semibold text-navy">Praise God — Share Your Testimony</h2>
              <p className="text-xs text-charcoal/40 font-body mt-0.5 truncate max-w-[280px]">{requestTitle}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl text-charcoal/35 hover:text-navy hover:bg-navy/5 transition-colors shrink-0" aria-label="Close">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          {error && <p className="text-xs font-body text-red-600 bg-red-50 border border-red-100 rounded-xl p-3">{error}</p>}

          <div>
            <label className="block text-xs font-body font-semibold text-navy/50 tracking-wider uppercase mb-1.5">
              How did God answer? <span className="text-red-400">*</span>
            </label>
            <textarea value={testimony} onChange={e => setTestimony(e.target.value)} rows={5} maxLength={2000}
              placeholder="Share your testimony to encourage others facing the same situation…"
              className="w-full px-4 py-3 rounded-xl border border-navy/12 focus:border-gold/40 focus:ring-2 focus:ring-gold/10 text-navy font-body text-sm outline-none resize-none transition-all" />
            <p className="text-xs text-charcoal/30 font-body mt-1 text-right">{testimony.length}/2000</p>
          </div>

          <div>
            <label className="block text-xs font-body font-semibold text-navy/50 tracking-wider uppercase mb-1.5">Category</label>
            <div className="grid grid-cols-3 gap-2">
              {PRAISE_CATEGORIES.map(cat => (
                <button key={cat.id} onClick={() => setCategory(cat.id)}
                  className={`px-3 py-2 rounded-xl border text-xs font-body transition-all ${category === cat.id ? 'bg-navy text-white border-navy' : 'border-navy/10 text-charcoal/55 hover:border-navy/25'}`}>
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-body font-semibold text-navy/50 tracking-wider uppercase mb-1.5">
              Bible verse <span className="text-charcoal/30 font-normal normal-case">Optional</span>
            </label>
            <input value={bibleVerse} onChange={e => setBibleVerse(e.target.value)} maxLength={100}
              placeholder='e.g. "I can do all things through Christ" — Philippians 4:13'
              className="w-full px-4 py-2.5 rounded-xl border border-navy/12 focus:border-gold/40 text-navy font-body text-sm outline-none transition-all" />
          </div>

          <div>
            <label className="block text-xs font-body font-semibold text-navy/50 tracking-wider uppercase mb-1.5">
              Thanksgiving <span className="text-charcoal/30 font-normal normal-case">Optional</span>
            </label>
            <input value={thanksgiving} onChange={e => setThanksgiving(e.target.value)} maxLength={300}
              placeholder="A short word of thanks…"
              className="w-full px-4 py-2.5 rounded-xl border border-navy/12 focus:border-gold/40 text-navy font-body text-sm outline-none transition-all" />
          </div>

          <label className="flex items-center gap-2.5 cursor-pointer p-3 rounded-xl bg-cream">
            <input type="checkbox" checked={isPublic} onChange={e => setIsPublic(e.target.checked)}
              className="w-4 h-4 rounded border-navy/20 text-navy focus:ring-gold/30" />
            <div>
              <p className="text-sm font-body font-medium text-navy">Share publicly in Praise Reports</p>
              <p className="text-xs text-charcoal/40 font-body">Encourage others walking through something similar</p>
            </div>
          </label>
        </div>

        <div className="px-6 py-4 border-t border-navy/8 flex gap-3 shrink-0">
          <button onClick={onClose} className="flex-1 py-3 border border-navy/15 text-navy/60 hover:text-navy text-sm font-body font-medium rounded-2xl transition-all">
            Cancel
          </button>
          <button onClick={handleSubmit} disabled={loading}
            className="flex-1 flex items-center justify-center gap-2 py-3 bg-green-600 hover:bg-green-700 text-white text-sm font-body font-semibold rounded-2xl transition-all disabled:opacity-50">
            {loading ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Check className="w-4 h-4" />}
            Share Testimony
          </button>
        </div>
      </div>
    </>
  )
}