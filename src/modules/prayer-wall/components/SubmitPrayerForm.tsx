'use client'
import { useState, useRef } from 'react'
import { X, Upload, FileText, ImageIcon, AlertTriangle, Lock } from 'lucide-react'
import { PRAYER_CATEGORIES, PRIVACY_OPTIONS } from '../types'
import { submitPrayerRequest } from '../services/prayer-service'
import { containsBlockedContent, sanitizeContent, BLOCKED_MESSAGE } from '../utils/content-safety'

type Props = { onClose: () => void; onSuccess: () => void }

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
const ALLOWED_TYPES = ['image/jpeg','image/png','image/webp','image/gif','application/pdf']

export default function SubmitPrayerForm({ onClose, onSuccess }: Props) {
  const [title,       setTitle]       = useState('')
  const [content,     setContent]     = useState('')
  const [category,    setCategory]    = useState('other')
  const [privacy,     setPrivacy]     = useState('community')  // DEFAULT: community -- was 'private', which meant submitted prayers silently never appeared in the feed
  const [displayName, setDisplayName] = useState('')
  const [attachment,  setAttachment]  = useState<File | null>(null)
  const [preview,     setPreview]     = useState<string | null>(null)
  const [loading,     setLoading]     = useState(false)
  const [error,       setError]       = useState<string | null>(null)
  const [safetyWarning, setSafetyWarning] = useState(false)
  const [step,        setStep]        = useState<1 | 2>(1)
  const fileRef = useRef<HTMLInputElement>(null)

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!ALLOWED_TYPES.includes(file.type)) { setError('Please upload an image (JPG, PNG, WebP, GIF) or PDF.'); return }
    if (file.size > MAX_FILE_SIZE) { setError('File must be under 5MB.'); return }
    setAttachment(file)
    setError(null)
    if (file.type.startsWith('image/')) {
      const reader = new FileReader()
      reader.onload = e => setPreview(e.target?.result as string)
      reader.readAsDataURL(file)
    } else {
      setPreview(null)
    }
  }

  const removeAttachment = () => { setAttachment(null); setPreview(null); if (fileRef.current) fileRef.current.value = '' }

  const handleSubmit = async () => {
    if (!title.trim() || !content.trim()) { setError('Please fill in the title and prayer request.'); return }
    if (content.trim().length < 20) { setError('Please write at least 20 characters for your prayer request.'); return }
    if (containsBlockedContent(title) || containsBlockedContent(content)) {
      setError(BLOCKED_MESSAGE)
      setSafetyWarning(true)
      return
    }
    setLoading(true); setError(null)
    const result = await submitPrayerRequest({ title, content, category, privacy, display_name: displayName, attachment })
    setLoading(false)
    if (result.success) onSuccess()
    else setError(result.error ?? 'Something went wrong. Please try again.')
  }

  const handleAutoRemove = () => {
    setTitle(t => sanitizeContent(t))
    setContent(c => sanitizeContent(c))
    setSafetyWarning(false)
    setError(null)
  }

  const privacySelected = PRIVACY_OPTIONS.find(p => p.id === privacy)

  return (
    <>
      <div className="fixed inset-0 z-40 bg-navy/30 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed inset-x-3 bottom-0 sm:inset-auto sm:left-1/2 sm:-translate-x-1/2 sm:top-1/2 sm:-translate-y-1/2 sm:w-full sm:max-w-lg z-50 bg-white dark:bg-navy-dark rounded-t-3xl sm:rounded-3xl shadow-2xl shadow-navy/25 flex flex-col max-h-[92vh]"
        role="dialog" aria-modal="true" aria-label="Submit prayer request">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-navy/8 shrink-0">
          <div>
            <h2 className="font-display text-xl font-semibold text-navy dark:text-cream">Share a Prayer Request</h2>
            <p className="text-xs text-charcoal/40 dark:text-cream/40 font-body mt-0.5">Step {step} of 2</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl text-charcoal/35 dark:text-cream/35 hover:text-navy dark:text-cream hover:bg-navy/5 transition-colors" aria-label="Close">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Progress bar */}
        <div className="h-1 bg-navy/6 shrink-0">
          <div className="h-1 bg-gold transition-all duration-300" style={{ width: step === 1 ? '50%' : '100%' }} />
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          {error && (
            <div className="flex items-start gap-2 p-3 rounded-xl bg-red-50 border border-red-100">
              <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-xs font-body text-red-600">{error}</p>
                {safetyWarning && (
                  <button onClick={handleAutoRemove} className="mt-2 text-xs font-body font-semibold text-red-700 underline hover:text-red-800">
                    Auto-remove flagged content and continue
                  </button>
                )}
              </div>
            </div>
          )}

          {step === 1 && (
            <>
              {/* Title */}
              <div>
                <label className="block text-xs font-body font-semibold text-navy/50 dark:text-cream/50 tracking-wider uppercase mb-1.5">
                  Prayer Title <span className="text-red-400">*</span>
                </label>
                <input
                  value={title} onChange={e => setTitle(e.target.value)} maxLength={100}
                  placeholder="A short title for your prayer request…"
                  className="w-full px-4 py-3 rounded-xl border border-navy/12 focus:border-gold/40 focus:ring-2 focus:ring-gold/10 text-navy dark:text-cream font-body text-sm outline-none transition-all"
                />
                <p className="text-xs text-charcoal/30 dark:text-cream/30 font-body mt-1 text-right">{title.length}/100</p>
              </div>

              {/* Category */}
              <div>
                <label className="block text-xs font-body font-semibold text-navy/50 dark:text-cream/50 tracking-wider uppercase mb-1.5">Category</label>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {PRAYER_CATEGORIES.map(cat => (
                    <button key={cat.id} onClick={() => setCategory(cat.id)}
                      className={`flex flex-col items-center gap-1 p-2.5 rounded-xl border text-xs font-body transition-all ${
                        category === cat.id ? 'border-navy bg-navy text-white' : 'border-navy/10 text-charcoal/55 dark:text-cream/55 hover:border-navy/25 hover:text-navy dark:text-cream'
                      }`}>
                      <span className="text-lg">{cat.icon}</span>
                      <span className="leading-tight text-center">{cat.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Prayer content */}
              <div>
                <label className="block text-xs font-body font-semibold text-navy/50 dark:text-cream/50 tracking-wider uppercase mb-1.5">
                  Your Prayer Request <span className="text-red-400">*</span>
                </label>
                <textarea
                  value={content} onChange={e => setContent(e.target.value)} rows={5} maxLength={2000}
                  placeholder="Share what you'd like the community to pray with you about… Be as specific as you feel comfortable."
                  className="w-full px-4 py-3 rounded-xl border border-navy/12 focus:border-gold/40 focus:ring-2 focus:ring-gold/10 text-navy dark:text-cream font-body text-sm outline-none resize-none transition-all"
                  style={{ caretColor: '#C9A84C' }}
                />
                <p className="text-xs text-charcoal/30 dark:text-cream/30 font-body mt-1 text-right">{content.length}/2000</p>
                <p className="text-xs text-navy/40 dark:text-cream/40 font-body mt-2 leading-relaxed">We review all posts and take reports seriously. Do not include personal contact information.</p>
              </div>

              {/* Attachment */}
              <div>
                <label className="block text-xs font-body font-semibold text-navy/50 dark:text-cream/50 tracking-wider uppercase mb-1.5">
                  Attachment <span className="text-charcoal/30 dark:text-cream/30 font-normal normal-case">Optional — image or PDF</span>
                </label>
                {!attachment ? (
                  <button
                    onClick={() => fileRef.current?.click()}
                    className="w-full flex flex-col items-center gap-2 p-5 rounded-xl border-2 border-dashed border-navy/15 hover:border-gold/40 hover:bg-gold/4 transition-all group"
                  >
                    <Upload className="w-6 h-6 text-navy/25 dark:text-cream/25 group-hover:text-gold transition-colors" />
                    <span className="text-sm font-body text-charcoal/40 dark:text-cream/40 group-hover:text-navy dark:text-cream transition-colors">
                      Click to upload image or PDF
                    </span>
                    <span className="text-xs text-charcoal/25 dark:text-cream/25 font-body">JPG, PNG, WebP, GIF, PDF — max 5MB</span>
                  </button>
                ) : (
                  <div className="rounded-xl border border-navy/12 overflow-hidden">
                    {preview ? (
                      <div className="relative">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={preview} alt="Attachment preview" className="w-full h-40 object-cover" />
                        <button
                          onClick={removeAttachment}
                          className="absolute top-2 right-2 w-7 h-7 rounded-full bg-white/90 dark:bg-navy-dark flex items-center justify-center text-charcoal/60 dark:text-cream/60 hover:text-red-500 shadow-sm"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-3 p-4">
                        <FileText className="w-8 h-8 text-navy/40 dark:text-cream/40 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-body font-medium text-navy dark:text-cream truncate">{attachment.name}</p>
                          <p className="text-xs text-charcoal/40 dark:text-cream/40 font-body">{(attachment.size / 1024).toFixed(0)} KB</p>
                        </div>
                        <button onClick={removeAttachment} className="text-charcoal/30 dark:text-cream/30 hover:text-red-400 transition-colors">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                )}
                <input ref={fileRef} type="file" accept="image/*,application/pdf" onChange={handleFile} className="hidden" />
              </div>
            </>
          )}

          {step === 2 && (
            <>
              {/* Privacy — DEFAULT IS PRIVATE */}
              <div>
                <label className="block text-xs font-body font-semibold text-navy/50 dark:text-cream/50 tracking-wider uppercase mb-1.5">
                  Privacy Setting
                </label>
                <div className="space-y-2">
                  {PRIVACY_OPTIONS.map(opt => (
                    <button
                      key={opt.id}
                      onClick={() => setPrivacy(opt.id)}
                      className={`w-full flex items-center gap-3 p-4 rounded-xl border text-left transition-all ${
                        privacy === opt.id ? 'border-navy bg-navy/4' : 'border-navy/10 hover:border-navy/25'
                      }`}
                    >
                      <span className="text-xl">{opt.icon}</span>
                      <div className="flex-1">
                        <p className={`text-sm font-body font-semibold ${privacy === opt.id ? 'text-navy dark:text-cream' : 'text-charcoal/60 dark:text-cream/60'}`}>
                          {opt.label} {opt.id === 'community' && <span className="text-xs text-gold font-normal">(Default)</span>}
                        </p>
                        <p className="text-xs text-charcoal/40 dark:text-cream/40 font-body">{opt.description}</p>
                      </div>
                      <div className={`w-4 h-4 rounded-full border-2 transition-all ${privacy === opt.id ? 'border-navy bg-navy' : 'border-navy/20'}`}>
                        {privacy === opt.id && <div className="w-2 h-2 bg-white dark:bg-navy-dark rounded-full m-auto mt-[2px]" />}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Display name (if not private/anonymous) */}
              {(privacy === 'community' || privacy === 'public') && (
                <div>
                  <label className="block text-xs font-body font-semibold text-navy/50 dark:text-cream/50 tracking-wider uppercase mb-1.5">
                    Display Name <span className="text-charcoal/30 dark:text-cream/30 font-normal normal-case">Optional</span>
                  </label>
                  <input
                    value={displayName} onChange={e => setDisplayName(e.target.value)} maxLength={50}
                    placeholder="How should we show your name? (e.g. Sarah M.)"
                    className="w-full px-4 py-3 rounded-xl border border-navy/12 focus:border-gold/40 text-navy dark:text-cream font-body text-sm outline-none transition-all"
                  />
                </div>
              )}

              {/* Privacy notice */}
              <div className="flex items-start gap-2 p-3.5 rounded-xl bg-navy/4 border border-navy/8">
                <Lock className="w-4 h-4 text-navy/40 dark:text-cream/40 shrink-0 mt-0.5" />
                <p className="text-xs font-body text-charcoal/55 dark:text-cream/55 leading-relaxed">
                  {privacy === 'private'
                    ? 'This request will only be visible to you. It will not appear on the Prayer Wall.'
                    : privacy === 'anonymous'
                    ? 'Your request will be shared without your name or any identifying information.'
                    : privacy === 'community'
                    ? 'Your request will be visible to registered Kingdom Companion members after review.'
                    : 'Your request will be publicly visible after our moderation team reviews it.'
                  }
                </p>
              </div>

              {/* Request summary */}
              <div className="p-4 rounded-xl bg-cream dark:bg-navy-dark border border-navy/8">
                <p className="text-xs font-body font-semibold text-navy/40 dark:text-cream/40 tracking-wider uppercase mb-2">Your Request Summary</p>
                <p className="text-sm font-display font-semibold text-navy dark:text-cream mb-1">{title}</p>
                <p className="text-xs font-body text-charcoal/50 dark:text-cream/50 line-clamp-2">{content}</p>
                {attachment && (
                  <p className="text-xs text-gold font-body font-medium mt-1.5">📎 {attachment.name}</p>
                )}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-navy/8 flex gap-3 shrink-0">
          {step === 2 && (
            <button onClick={() => setStep(1)} className="flex-1 py-3 border border-navy/15 text-navy/60 dark:text-cream/60 hover:text-navy dark:text-cream text-sm font-body font-medium rounded-2xl transition-all">
              Back
            </button>
          )}
          <button
            onClick={step === 1 ? () => {
              if (!title.trim() || !content.trim()) { setError('Please fill in the title and prayer request.'); return }
              setError(null); setStep(2)
            } : handleSubmit}
            disabled={loading}
            className="flex-1 flex items-center justify-center gap-2 py-3 bg-navy hover:bg-navy-light text-white text-sm font-body font-semibold rounded-2xl transition-all disabled:opacity-50"
          >
            {loading
              ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              : step === 1 ? 'Next →' : '🙏 Submit Prayer Request'
            }
          </button>
        </div>
      </div>
    </>
  )
}