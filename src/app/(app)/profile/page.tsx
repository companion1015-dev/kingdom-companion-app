'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { User, Save, Check } from 'lucide-react'
import Navigation from '@/components/layout/Navigation'
import Footer from '@/components/layout/Footer'
import { useTheme } from '@/components/providers/ThemeProvider'

// Genuinely new page -- no Profile/Settings page existed anywhere before
// this. Users could fully use the app but had no way to update their name,
// preferred translation, theme, or reading font size.

type Profile = {
  email: string
  display_name: string
  preferred_translation: string
  theme: string
  font_size: number
  created_at: string
  email_verified_at: string | null
}

const TRANSLATIONS = [
  { code: 'BSB',   name: 'Berean Standard Bible' },
  { code: 'KJV',   name: 'King James Version' },
  { code: 'ASV',   name: 'American Standard Version' },
  { code: 'WEBUS', name: 'World English Bible' },
]

export default function ProfilePage() {
  const [profile,  setProfile]  = useState<Profile | null>(null)
  const [loading,  setLoading]  = useState(true)
  const [saving,   setSaving]   = useState(false)
  const [error,    setError]    = useState<string | null>(null)
  const [saved,    setSaved]    = useState(false)

  const [displayName, setDisplayName] = useState('')
  const [translation, setTranslation] = useState('BSB')
  const { theme, setTheme } = useTheme()
  const [fontSize,    setFontSize]    = useState(16)

  useEffect(() => {
    fetch('/api/v1/user/profile', { credentials: 'include' })
      .then(async res => {
        if (res.status === 401) { setError('Please sign in to view your profile.'); return }
        const data = await res.json()
        if (data.success) {
          setProfile(data.data)
          setDisplayName(data.data.display_name)
          setTranslation(data.data.preferred_translation)
          setFontSize(data.data.font_size)
        } else {
          setError(data.error?.message ?? 'Unable to load your profile.')
        }
      })
      .catch(() => setError('Network error. Please try again.'))
      .finally(() => setLoading(false))
  }, [])

  const handleSave = async () => {
    setSaving(true); setError(null); setSaved(false)
    try {
      const res  = await fetch('/api/v1/user/profile', {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' }, credentials: 'include',
        body: JSON.stringify({ display_name: displayName, preferred_translation: translation, theme, font_size: fontSize }),
      })
      const data = await res.json()
      if (data.success) { setSaved(true); setTimeout(() => setSaved(false), 2500) }
      else setError(data.error?.message ?? 'Unable to save changes.')
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-cream dark:bg-navy-dark-gradient">
      <Navigation />
      <main className="max-w-2xl mx-auto px-4 py-10">
        <div className="flex items-center gap-3 mb-2">
PROFCHUNK1EOF          <User className="w-7 h-7 text-navy dark:text-cream" />
          <h1 className="text-3xl font-serif text-navy dark:text-cream">Your Profile</h1>
        </div>
        <p className="text-navy/60 dark:text-cream/60 mb-8">Manage your name, preferred translation, and reading preferences.</p>

        {loading && (
          <div className="flex justify-center py-16">
            <div className="w-6 h-6 border-2 border-navy/20 border-t-navy rounded-full animate-spin" />
          </div>
        )}

        {!loading && error && !profile && (
          <div className="bg-white dark:bg-navy-dark rounded-2xl border border-navy/8 p-8 text-center">
            <p className="text-charcoal/55 dark:text-cream/55 font-body text-sm mb-4">{error}</p>
            {error.includes('sign in') && (
              <Link href="/login" className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-navy hover:bg-navy-light text-white text-sm font-body font-semibold transition-all">
                Sign In
              </Link>
            )}
          </div>
        )}

        {!loading && profile && (
          <div className="bg-white dark:bg-navy-dark rounded-2xl border border-navy/8 p-6 sm:p-8 space-y-5">
            {error && <p className="text-xs font-body text-red-600 bg-red-50 border border-red-100 rounded-xl p-3">{error}</p>}

            <div>
              <label className="block text-xs font-body font-semibold text-navy/50 dark:text-cream/50 tracking-wider uppercase mb-1.5">Email</label>
              <p className="px-4 py-2.5 rounded-xl bg-cream dark:bg-navy-dark border border-navy/10 text-charcoal/50 dark:text-cream/50 font-body text-sm">{profile.email}</p>
              <p className="text-xs text-charcoal/35 dark:text-cream/35 font-body mt-1">
                {profile.email_verified_at ? 'Verified' : 'Not yet verified'} · Member since {new Date(profile.created_at).toLocaleDateString()}
              </p>
            </div>

            <div>
              <label className="block text-xs font-body font-semibold text-navy/50 dark:text-cream/50 tracking-wider uppercase mb-1.5">Display Name</label>
              <input value={displayName} onChange={e => setDisplayName(e.target.value)} maxLength={100}
                className="w-full px-4 py-2.5 rounded-xl border border-navy/12 focus:border-gold/40 focus:ring-2 focus:ring-gold/10 text-navy dark:text-cream font-body text-sm outline-none transition-all" />
            </div>

            <div>
              <label className="block text-xs font-body font-semibold text-navy/50 dark:text-cream/50 tracking-wider uppercase mb-1.5">Preferred Bible Translation</label>
              <div className="grid grid-cols-2 gap-2">
                {TRANSLATIONS.map(t => (
                  <button key={t.code} onClick={() => setTranslation(t.code)}
                    className={`px-3 py-2.5 rounded-xl border text-sm font-body text-left transition-all ${translation === t.code ? 'bg-navy text-white border-navy' : 'border-navy/12 text-charcoal/60 dark:text-cream/60 hover:border-navy/30'}`}>
                    <span className="font-semibold">{t.code}</span> <span className="text-xs opacity-70">— {t.name}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-body font-semibold text-navy/50 dark:text-cream/50 tracking-wider uppercase mb-1.5">Theme</label>
              <div className="flex gap-2">
                {(['light', 'dark'] as const).map(t => (
                  <button key={t} onClick={() => setTheme(t)}
                    className={`flex-1 px-4 py-2.5 rounded-xl border text-sm font-body font-medium capitalize transition-all ${theme === t ? 'bg-navy text-white border-navy' : 'border-navy/12 text-charcoal/60 dark:text-cream/60 hover:border-navy/30'}`}>
                    {t}
                  </button>
                ))}
              </div>
              <p className="text-xs text-charcoal/35 dark:text-cream/35 font-body mt-1.5">Dark mode preference is saved now; full dark-mode styling across the app is a separate future update.</p>
            </div>

            <div>
              <label className="block text-xs font-body font-semibold text-navy/50 dark:text-cream/50 tracking-wider uppercase mb-1.5">Reading Font Size — {fontSize}px</label>
              <input type="range" min={12} max={28} value={fontSize} onChange={e => setFontSize(Number(e.target.value))}
                className="w-full accent-navy" />
              <p className="text-sm mt-2 text-charcoal/60 dark:text-cream/60 font-body" style={{ fontSize: `${fontSize}px` }}>
                The quick brown fox jumps over the lazy dog.
              </p>
            </div>

            <button onClick={handleSave} disabled={saving}
              className={`w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl text-sm font-body font-semibold transition-all ${saved ? 'bg-green-600 text-white' : 'bg-navy hover:bg-navy-light text-white'} disabled:opacity-60`}>
              {saving ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : saved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
              {saved ? 'Saved' : saving ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        )}
      </main>
      <Footer />
    </div>
  )
}
