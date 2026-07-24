'use client'
import { useState } from 'react'
import Image from 'next/image'
import {
  Heart, MessageSquare, BookOpen, Bookmark, Share2, Flag,
  MapPin, Clock, CheckCircle2, Sparkles, ChevronDown, ChevronUp,
  FileText, ImageIcon
} from 'lucide-react'
import type { PrayerRequest, PrayerCategory } from '../types'
import { PRAYER_CATEGORIES } from '../types'
import { prayForRequest, sendEncouragement, savePrayer, reportPrayer, formatPrayerTime } from '../services/prayer-service'

type Props = {
  prayer:     PrayerRequest
  onUpdate?:  (id: string, updates: Partial<PrayerRequest>) => void
  onAnswer?:  (id: string) => void
  isOwner?:   boolean
  compact?:   boolean
}

const CATEGORY_CONFIG = Object.fromEntries(
  PRAYER_CATEGORIES.map(c => [c.id, c])
) as unknown as Record<PrayerCategory, { label: string; icon: string }>

const COUNTRY_FLAGS: Record<string, string> = {
  GB:'🇬🇧', US:'🇺🇸', NG:'🇳🇬', GH:'🇬🇭', KE:'🇰🇪', ZA:'🇿🇦',
  AU:'🇦🇺', CA:'🇨🇦', IN:'🇮🇳', PH:'🇵🇭', BR:'🇧🇷', DE:'🇩🇪',
}

export default function PrayerCard({ prayer, onUpdate, onAnswer, isOwner, compact }: Props) {
  const [prayed,      setPrayed]      = useState(prayer.has_prayed ?? false)
  const [saved,       setSaved]       = useState(prayer.has_saved  ?? false)
  const [prayCount,   setPrayCount]   = useState(prayer.prayer_count)
  const [showEnc,     setShowEnc]     = useState(false)
  const [showReport,  setShowReport]  = useState(false)
  const [showVerse,   setShowVerse]   = useState(false)
  const [expanded,    setExpanded]    = useState(false)
  const [encText,     setEncText]     = useState('')
  const [verseText,   setVerseText]   = useState('')
  const [reportReason,setReportReason]= useState('')
  const [toast,       setToast]       = useState<string | null>(null)
  const [loading,     setLoading]     = useState<string | null>(null)

  const cat     = CATEGORY_CONFIG[prayer.category]
  const flag    = prayer.country_code ? COUNTRY_FLAGS[prayer.country_code] : null
  const isLong  = prayer.content.length > 200
  const display = !expanded && isLong ? prayer.content.slice(0, 200) + '…' : prayer.content

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 2500) }

  const handlePray = async () => {
    if (prayed) return
    setLoading('pray')
    const ok = await prayForRequest(prayer.id)
    if (ok) { setPrayed(true); setPrayCount(c => c + 1); showToast('🙏 Praying with you') }
    setLoading(null)
    onUpdate?.(prayer.id, { prayer_count: prayCount + 1, has_prayed: true })
  }

  const handleSave = async () => {
    setLoading('save')
    await savePrayer(prayer.id)
    setSaved(s => !s)
    showToast(saved ? 'Removed from saved' : '🔖 Saved for prayer')
    setLoading(null)
  }

  const handleEncouragement = async () => {
    if (!encText.trim()) return
    setLoading('enc')
    const ok = await sendEncouragement(prayer.id, 'encouragement', encText)
    if (ok) { setEncText(''); setShowEnc(false); showToast('❤️ Encouragement sent') }
    setLoading(null)
  }

  const handleVerse = async () => {
    if (!verseText.trim()) return
    setLoading('verse')
    const ok = await sendEncouragement(prayer.id, 'verse', verseText)
    if (ok) { setVerseText(''); setShowVerse(false); showToast('📖 Verse shared') }
    setLoading(null)
  }

  const handleReport = async () => {
    if (!reportReason) return
    setLoading('report')
    await reportPrayer(prayer.id, reportReason)
    setShowReport(false)
    showToast('🚩 Report submitted — thank you')
    setLoading(null)
  }

  const handleShare = async () => {
    const text = `Please pray: "${prayer.title}" — Kingdom Companion Prayer Wall`
    try {
      if (navigator.share) await navigator.share({ title: prayer.title, text, url: window.location.href })
      else { await navigator.clipboard.writeText(text); showToast('Link copied') }
    } catch { /* cancelled */ }
  }

  return (
    <div className={`bg-white rounded-2xl border transition-all duration-200 hover:shadow-md hover:shadow-navy/8 ${
      prayer.is_featured ? 'border-gold/30 shadow-sm shadow-gold/10' : 'border-navy/8'
    }`}>
      {/* Featured banner */}
      {prayer.is_featured && (
        <div className="flex items-center gap-2 px-5 py-2 bg-gold/8 border-b border-gold/15 rounded-t-2xl">
          <Sparkles className="w-3 h-3 text-gold" />
          <span className="text-xs font-body font-semibold text-gold tracking-wider">Featured Prayer Request</span>
        </div>
      )}

      <div className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-2.5 flex-1 min-w-0">
            {/* Avatar */}
            <div className="w-9 h-9 rounded-full bg-navy/8 flex items-center justify-center shrink-0 text-lg">
              {prayer.display_name
                ? prayer.display_name.charAt(0).toUpperCase()
                : cat?.icon ?? '🙏'
              }
            </div>
            <div className="min-w-0">
              <p className="text-sm font-body font-semibold text-navy truncate">
                {prayer.display_name ?? 'Anonymous'}
              </p>
              <div className="flex items-center gap-1.5 flex-wrap">
                {flag && <span className="text-xs">{flag}</span>}
                <span className="text-xs text-charcoal/35 font-body flex items-center gap-1">
                  <Clock className="w-2.5 h-2.5" /> {formatPrayerTime(prayer.created_at)}
                </span>
              </div>
            </div>
          </div>
          {/* Category badge */}
          <span className="shrink-0 inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-navy/5 text-xs font-body text-navy/60 font-medium">
            {cat?.icon} {cat?.label}
          </span>
        </div>

        {/* Title */}
        <h3 className="font-display text-lg font-semibold text-navy mb-2">{prayer.title}</h3>

        {/* Content */}
        <div>
          <p className="text-sm font-body text-charcoal/65 leading-relaxed">{display}</p>
          {isLong && (
            <button
              onClick={() => setExpanded(e => !e)}
              className="flex items-center gap-1 text-xs text-gold hover:text-gold-dark font-body font-medium mt-1.5 transition-colors"
            >
              {expanded ? <><ChevronUp className="w-3 h-3" /> Show less</> : <><ChevronDown className="w-3 h-3" /> Read more</>}
            </button>
          )}
        </div>

        {/* Attachment */}
        {prayer.attachment_url && (
          <div className="mt-3">
            {prayer.attachment_type === 'image' ? (
              <div className="relative w-full h-48 rounded-xl overflow-hidden border border-navy/8">
                <Image src={prayer.attachment_url} alt="Prayer attachment" fill className="object-cover" sizes="400px" />
              </div>
            ) : (
              <a href={prayer.attachment_url} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-2.5 p-3 rounded-xl border border-navy/8 hover:border-gold/20 bg-cream transition-colors group">
                <FileText className="w-5 h-5 text-navy/40 group-hover:text-gold transition-colors" />
                <span className="text-sm font-body text-navy/60 group-hover:text-navy">View attachment</span>
              </a>
            )}
          </div>
        )}

        {/* Stats */}
        <div className="flex items-center gap-4 mt-4 pb-4 border-b border-navy/6">
          <span className="flex items-center gap-1.5 text-xs text-charcoal/45 font-body">
            <Heart className={`w-3.5 h-3.5 ${prayed ? 'text-red-400 fill-current' : ''}`} />
            {prayCount} {prayCount === 1 ? 'person praying' : 'people praying'}
          </span>
          {(prayer.encouragement_count ?? 0) > 0 && (
            <span className="flex items-center gap-1.5 text-xs text-charcoal/35 font-body">
              <MessageSquare className="w-3.5 h-3.5" />
              {prayer.encouragement_count} encouragements
            </span>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex flex-wrap gap-2 mt-4">
          {/* I Prayed */}
          <button
            onClick={handlePray}
            disabled={prayed || loading === 'pray'}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-body font-semibold transition-all ${
              prayed
                ? 'bg-red-50 text-red-500 border border-red-200 cursor-default'
                : 'bg-navy hover:bg-navy-light text-white shadow-sm hover:scale-105'
            }`}
          >
            <Heart className={`w-3.5 h-3.5 ${prayed ? 'fill-current' : ''}`} />
            {prayed ? 'Prayed ✓' : 'I Prayed'}
          </button>

          {/* Encourage */}
          <button
            onClick={() => { setShowEnc(e => !e); setShowVerse(false); setShowReport(false) }}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-body font-medium border border-navy/12 text-navy/60 hover:border-navy/25 hover:text-navy transition-all"
          >
            <MessageSquare className="w-3.5 h-3.5" /> Encourage
          </button>

          {/* Share Scripture */}
          <button
            onClick={() => { setShowVerse(e => !e); setShowEnc(false); setShowReport(false) }}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-body font-medium border border-navy/12 text-navy/60 hover:border-navy/25 hover:text-navy transition-all"
          >
            <BookOpen className="w-3.5 h-3.5" /> Scripture
          </button>

          {/* Save */}
          <button
            onClick={handleSave}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-body font-medium border transition-all ${
              saved ? 'border-gold/40 text-gold bg-gold/8' : 'border-navy/12 text-navy/60 hover:border-navy/25 hover:text-navy'
            }`}
          >
            <Bookmark className={`w-3.5 h-3.5 ${saved ? 'fill-current' : ''}`} /> {saved ? 'Saved' : 'Save'}
          </button>

          {/* Share */}
          <button
            onClick={handleShare}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-body font-medium border border-navy/12 text-navy/60 hover:border-navy/25 hover:text-navy transition-all"
          >
            <Share2 className="w-3.5 h-3.5" /> Share
          </button>

          {/* Mark answered (owner only) */}
          {isOwner && prayer.status === 'active' && (
            <button
              onClick={() => onAnswer?.(prayer.id)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-body font-semibold bg-green-50 text-green-700 border border-green-200 hover:bg-green-100 transition-all ml-auto"
            >
              <CheckCircle2 className="w-3.5 h-3.5" /> Mark Answered
            </button>
          )}

          {/* Report (not owner) */}
          {!isOwner && (
            <button
              onClick={() => { setShowReport(e => !e); setShowEnc(false); setShowVerse(false) }}
              className="flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-body text-charcoal/30 hover:text-red-400 transition-colors ml-auto"
            >
              <Flag className="w-3 h-3" /> Report
            </button>
          )}
        </div>

        {/* Encouragement input */}
        {showEnc && (
          <div className="mt-4 p-4 rounded-xl bg-cream border border-navy/8">
            <p className="text-xs font-body font-semibold text-navy/50 tracking-wider uppercase mb-2">Send Encouragement</p>
            <textarea
              value={encText}
              onChange={e => setEncText(e.target.value)}
              placeholder="Write a word of encouragement…"
              rows={3}
              maxLength={500}
              className="w-full bg-white rounded-lg border border-navy/10 px-3 py-2 text-sm font-body text-navy placeholder-charcoal/30 outline-none focus:border-gold/40 resize-none"
            />
            <div className="flex justify-between items-center mt-2">
              <span className="text-xs text-charcoal/30 font-body">{encText.length}/500</span>
              <button
                onClick={handleEncouragement}
                disabled={!encText.trim() || loading === 'enc'}
                className="px-4 py-1.5 bg-navy hover:bg-navy-light text-white text-xs font-body font-semibold rounded-full disabled:opacity-40 transition-all"
              >
                {loading === 'enc' ? '…' : 'Send ❤️'}
              </button>
            </div>
          </div>
        )}

        {/* Scripture input */}
        {showVerse && (
          <div className="mt-4 p-4 rounded-xl bg-cream border border-navy/8">
            <p className="text-xs font-body font-semibold text-navy/50 tracking-wider uppercase mb-2">Share a Scripture</p>
            <input
              value={verseText}
              onChange={e => setVerseText(e.target.value)}
              placeholder='e.g. "Cast all your anxiety on him" — 1 Peter 5:7'
              maxLength={300}
              className="w-full bg-white rounded-lg border border-navy/10 px-3 py-2.5 text-sm font-body text-navy placeholder-charcoal/30 outline-none focus:border-gold/40"
            />
            <div className="flex justify-end mt-2">
              <button
                onClick={handleVerse}
                disabled={!verseText.trim() || loading === 'verse'}
                className="px-4 py-1.5 bg-navy hover:bg-navy-light text-white text-xs font-body font-semibold rounded-full disabled:opacity-40 transition-all"
              >
                {loading === 'verse' ? '…' : 'Share 📖'}
              </button>
            </div>
          </div>
        )}

        {/* Report input */}
        {showReport && (
          <div className="mt-4 p-4 rounded-xl bg-red-50 border border-red-100">
            <p className="text-xs font-body font-semibold text-red-600 tracking-wider uppercase mb-2">Report this request</p>
            <div className="grid grid-cols-2 gap-1.5 mb-3">
              {['spam','scam','offensive','misinformation','harassment','other'].map(r => (
                <button
                  key={r}
                  onClick={() => setReportReason(r)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-body border transition-all text-left ${
                    reportReason === r ? 'bg-red-100 border-red-300 text-red-700 font-semibold' : 'border-red-100 text-charcoal/50 hover:border-red-200'
                  }`}
                >
                  {r.charAt(0).toUpperCase() + r.slice(1)}
                </button>
              ))}
            </div>
            <div className="flex justify-end gap-2">
              <button onClick={() => setShowReport(false)} className="px-3 py-1.5 text-xs font-body text-charcoal/40 hover:text-navy">Cancel</button>
              <button
                onClick={handleReport}
                disabled={!reportReason || loading === 'report'}
                className="px-4 py-1.5 bg-red-500 hover:bg-red-600 text-white text-xs font-body font-semibold rounded-full disabled:opacity-40 transition-all"
              >
                Submit Report
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Toast */}
      {toast && (
        <div className="mx-5 mb-4 px-4 py-2 bg-navy text-white text-xs font-body font-medium rounded-full text-center animate-fade-in" role="status">
          {toast}
        </div>
      )}
    </div>
  )
}