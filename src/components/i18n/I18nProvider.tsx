'use client'
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { AUTO, DEFAULT_LOCALE, LOCALE_COOKIE, dirOf, isPreference, resolveLocale, translate, type LocaleCode, type LocalePreference } from '@/lib/i18n'

export type SaveResult = 'saved' | 'guest' | 'failed'

type Ctx = {
  /** The language actually shown (a preference of 'auto' is resolved to a real language). */
  locale: LocaleCode
  /** What the user picked: a language, or 'auto' = device language. */
  preference: LocalePreference
  dir: 'ltr' | 'rtl'
  /** Translate an English text into the current language (falls back to the English text). */
  tr: (text: string) => string
  /** Alias of tr. */
  t: (text: string) => string
  /** Switch on this device only (cookie). */
  setPreference: (p: LocalePreference) => void
  /** Switch, and also save to the signed-in user's account (guests: device only). */
  choosePreference: (p: LocalePreference) => Promise<SaveResult>
  /** Alias of choosePreference. */
  chooseLocale: (p: LocalePreference) => Promise<SaveResult>
}

const noop = async (): Promise<SaveResult> => 'guest'
const I18nContext = createContext<Ctx>({
  locale: DEFAULT_LOCALE, preference: DEFAULT_LOCALE, dir: 'ltr', tr: s => s, t: s => s,
  setPreference: () => {}, choosePreference: noop, chooseLocale: noop,
})

export function readLocaleCookie(): LocalePreference | null {
  try {
    const m = document.cookie.match(new RegExp('(?:^|; )' + LOCALE_COOKIE + '=([^;]*)'))
    const v = m ? decodeURIComponent(m[1]) : ''
    return isPreference(v) ? v : null
  } catch { return null }
}
const writeLocaleCookie = (p: LocalePreference) => { document.cookie = `${LOCALE_COOKIE}=${encodeURIComponent(p)}; path=/; max-age=31536000; samesite=lax` }
const deviceTags = (): string[] => { try { return navigator.languages?.length ? [...navigator.languages] : [navigator.language] } catch { return [] } }

export default function I18nProvider({ children, initialLocale = DEFAULT_LOCALE }: { children: React.ReactNode; initialLocale?: LocaleCode }) {
  const [preference, setPrefState] = useState<LocalePreference>(initialLocale)
  const [locale, setLocaleState] = useState<LocaleCode>(initialLocale)

  const apply = useCallback((p: LocalePreference, writeCookie: boolean) => {
    if (writeCookie) writeLocaleCookie(p)
    setPrefState(p)
    setLocaleState(resolveLocale(p, deviceTags()))
  }, [])
  const setPreference = useCallback((p: LocalePreference) => apply(p, true), [apply])

  // Keep <html lang dir> in step with the language (a head script already set it before first paint).
  useEffect(() => {
    document.documentElement.lang = locale
    document.documentElement.dir = dirOf(locale)
  }, [locale])

  // On load: use this device's saved choice; if there is none, a signed-in user's account choice
  // (so the language follows them to a new device). One probe per browser session; guests get a quiet 401.
  useEffect(() => {
    const saved = readLocaleCookie()
    if (saved) { apply(saved, false); return }
    try {
      if (sessionStorage.getItem('kc_lang_probed')) return
      sessionStorage.setItem('kc_lang_probed', '1')
    } catch { /* storage unavailable: probe anyway */ }
    fetch('/api/v1/user/language', { credentials: 'include' })
      .then(r => (r.ok ? r.json() : null))
      .then(j => { const v = j?.data?.interface_language; if (isPreference(v) && v !== DEFAULT_LOCALE) apply(v, true) })
      .catch(() => {})
  }, [apply])

  const choosePreference = useCallback(async (p: LocalePreference): Promise<SaveResult> => {
    apply(p, true)
    try {
      const res = await fetch('/api/v1/user/language', {
        method: 'PUT', headers: { 'Content-Type': 'application/json' }, credentials: 'include',
        body: JSON.stringify({ interface_language: p }),
      })
      if (res.status === 401) return 'guest'
      return res.ok ? 'saved' : 'failed'
    } catch { return 'failed' }
  }, [apply])

  const value = useMemo<Ctx>(() => {
    const tr = (text: string) => translate(locale, text)
    return { locale, preference, dir: dirOf(locale), tr, t: tr, setPreference, choosePreference, chooseLocale: choosePreference }
  }, [locale, preference, setPreference, choosePreference])

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export const useI18n = () => useContext(I18nContext)
export { AUTO }
