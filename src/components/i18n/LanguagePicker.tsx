'use client'
import { useState } from 'react'
import { LANGUAGES, type LocaleCode } from '@/lib/i18n'
import { useI18n } from './I18nProvider'

export default function LanguagePicker() {
  const { locale, setLocale, t } = useI18n()
  const [msg, setMsg] = useState<string | null>(null)
  const current = LANGUAGES.find(l => l.code === locale)

  async function choose(code: LocaleCode) {
    setLocale(code) // applies instantly, also for guests
    setMsg(null)
    try {
      const res = await fetch('/api/v1/user/language', {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        credentials: 'include', body: JSON.stringify({ interface_language: code }),
      })
      if (res.status === 401) return // guest: cookie only
      setMsg(res.ok ? t('lang.saved') : t('lang.saveFailed'))
    } catch { setMsg(t('lang.saveFailed')) }
  }

  return (
    <section aria-labelledby="lang-h" className="max-w-md">
      <h2 id="lang-h" className="font-heading text-xl mb-1">{t('lang.interface')}</h2>
      <p className="text-sm opacity-80 mb-3">{t('lang.help')}</p>
      <ul className="space-y-2" role="radiogroup" aria-labelledby="lang-h">
        {LANGUAGES.map(l => (
          <li key={l.code}>
            <button type="button" role="radio" aria-checked={l.code === locale} onClick={() => choose(l.code)}
              className={`w-full min-h-[44px] flex items-center justify-between rounded-lg border px-4 py-2 text-start ${l.code === locale ? 'border-current font-semibold' : 'opacity-80'}`}>
              <span lang={l.code} dir={l.dir}>{l.native}</span>
              <span className="text-xs opacity-70">{l.english}{l.status === 'beta' ? ' · beta' : ''}</span>
            </button>
          </li>
        ))}
      </ul>
      {current?.status === 'beta' && <p className="text-xs mt-3 opacity-80" role="note">{t('lang.beta')}</p>}
      <p className="text-xs mt-2 opacity-70">{t('lang.bibleNote')}</p>
      {msg && <p className="text-sm mt-2" role="status">{msg}</p>}
    </section>
  )
}
