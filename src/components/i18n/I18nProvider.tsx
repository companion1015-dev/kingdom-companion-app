'use client'
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { DEFAULT_LOCALE, LOCALE_COOKIE, dirOf, isLocale, translate, type LocaleCode, type MessageKey } from '@/lib/i18n'

type Ctx = { locale: LocaleCode; setLocale: (c: LocaleCode) => void; t: (k: MessageKey) => string }
const I18nContext = createContext<Ctx>({ locale: DEFAULT_LOCALE, setLocale: () => {}, t: k => translate(DEFAULT_LOCALE, k) })

function readCookie(): LocaleCode | null {
  const m = document.cookie.match(new RegExp('(?:^|; )' + LOCALE_COOKIE + '=([^;]*)'))
  return m && isLocale(decodeURIComponent(m[1])) ? (decodeURIComponent(m[1]) as LocaleCode) : null
}

export default function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<LocaleCode>(DEFAULT_LOCALE)

  // Apply <html lang dir> whenever the language changes. Runs on the client only,
  // so existing server rendering of every page stays exactly as it is today.
  useEffect(() => {
    document.documentElement.lang = locale
    document.documentElement.dir = dirOf(locale)
  }, [locale])

  useEffect(() => {
    const c = readCookie()
    if (c) setLocaleState(c)
  }, [])

  const setLocale = useCallback((c: LocaleCode) => {
    document.cookie = `${LOCALE_COOKIE}=${encodeURIComponent(c)}; path=/; max-age=31536000; samesite=lax`
    setLocaleState(c)
  }, [])

  const value = useMemo<Ctx>(() => ({ locale, setLocale, t: k => translate(locale, k) }), [locale, setLocale])
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export const useI18n = () => useContext(I18nContext)
