'use client'
import { useEffect, useState } from 'react'
import { matchDeviceLanguage, translate, type LanguageInfo } from '@/lib/i18n'
import { readLocaleCookie, useI18n } from './I18nProvider'

const DISMISS_KEY = 'kc_lang_suggestion_dismissed'

// One-time, polite suggestion: "This app is available in your language" — in THAT language.
// Shown only if the visitor has never chosen a language and never dismissed it. Never forced, never repeated.
export default function LanguageSuggestion() {
  const { locale, chooseLocale } = useI18n()
  const [target, setTarget] = useState<LanguageInfo | null>(null)

  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        if (locale !== 'en' || readLocaleCookie() || localStorage.getItem(DISMISS_KEY)) return
        const match = matchDeviceLanguage(navigator.languages?.length ? navigator.languages : [navigator.language])
        if (match && match.code !== 'en') setTarget(match)
      } catch { /* storage blocked: stay quiet */ }
    }, 1500) // lets a signed-in user's saved language arrive first
    return () => clearTimeout(timer)
  }, [locale])

  if (!target) return null
  const dismiss = () => { try { localStorage.setItem(DISMISS_KEY, '1') } catch {} setTarget(null) }
  const accept = () => { chooseLocale(target.code); setTarget(null) }

  return (
    <div role="region" aria-label={translate(target.code, 'App language')} lang={target.code} dir={target.dir}
      className="fixed inset-x-0 bottom-0 z-50 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
      <div className="mx-auto max-w-md rounded-2xl border border-navy/15 bg-white dark:bg-navy-dark text-charcoal dark:text-cream shadow-xl p-4">
        <p className="text-sm mb-3">{translate(target.code, 'This app is available in your language.')}</p>
        <div className="flex gap-2">
          <button type="button" onClick={accept} className="min-h-[44px] flex-1 rounded-xl bg-navy text-white text-sm font-semibold px-4">{target.native}</button>
          <button type="button" onClick={dismiss} className="min-h-[44px] flex-1 rounded-xl border border-navy/20 text-sm px-4">{translate(target.code, 'Keep English')}</button>
        </div>
      </div>
    </div>
  )
}
