'use client'
import { useState } from 'react'
import { AUTO, languageOf, offeredLanguages, type LocalePreference } from '@/lib/i18n'
import { useI18n } from './I18nProvider'

const SEARCH_FROM = 8 // show a search box once many languages are offered

export default function LanguagePicker() {
  const { locale, preference, choosePreference, tr } = useI18n()
  const [message, setMessage] = useState<string | null>(null) // kept in English, translated when shown
  const [query, setQuery] = useState('')
  const current = languageOf(locale)
  const all = offeredLanguages()
  const q = query.trim().toLowerCase()
  const shown = q ? all.filter(l => (l.native + ' ' + l.english + ' ' + l.code).toLowerCase().includes(q)) : all

  async function choose(p: LocalePreference) {
    setMessage(null)
    const result = await choosePreference(p)
    if (result === 'saved') setMessage('Saved')
    else if (result === 'failed') setMessage('Could not save to your account. Your choice still applies on this device.')
  }
  const rowClass = (on: boolean) => `w-full min-h-[44px] flex items-center justify-between gap-3 rounded-lg border px-4 py-2 text-start ${on ? 'border-current font-semibold' : 'opacity-80'}`

  return (
    <section aria-labelledby="lang-h" className="max-w-md">
      <h2 id="lang-h" className="font-heading text-xl mb-1">{tr('App language')}</h2>
      <p className="text-sm opacity-80 mb-3">{tr('Choose the language for menus and buttons. Your choice is saved to your account.')}</p>
      {all.length > SEARCH_FROM && (
        <input type="search" value={query} onChange={e => setQuery(e.target.value)} placeholder={tr('Search languages')} aria-label={tr('Search languages')}
          className="w-full min-h-[44px] mb-3 rounded-lg border px-4 py-2 bg-transparent" />
      )}
      <ul className="space-y-2" role="radiogroup" aria-labelledby="lang-h">
        {!q && (
          <li>
            <button type="button" role="radio" aria-checked={preference === AUTO} onClick={() => choose(AUTO)} className={rowClass(preference === AUTO)}>
              <span>
                <span className="block">{tr('Device language')}</span>
                <span className="block text-xs font-normal opacity-70">{tr('Follows your phone or browser settings.')}</span>
              </span>
              <span className="text-xs opacity-70" lang={current.code} dir={current.dir}>{current.native}</span>
            </button>
          </li>
        )}
        {shown.map(l => (
          <li key={l.code}>
            <button type="button" role="radio" aria-checked={preference === l.code} onClick={() => choose(l.code)} className={rowClass(preference === l.code)}>
              <span lang={l.code} dir={l.dir}>{l.native}</span>
              <span className="text-xs opacity-70">{l.english}{l.status === 'beta' ? ' · beta' : ''}</span>
            </button>
          </li>
        ))}
      </ul>
      {current.status === 'beta' && <p className="text-xs mt-3 opacity-80" role="note">{tr('Beta: wording not yet reviewed by a native speaker')}</p>}
      <p className="text-xs mt-2 opacity-70">{tr('Bible text comes from licensed Bible versions and is never machine-translated.')}</p>
      {message && <p className="text-sm mt-2" role="status">{tr(message)}</p>}
    </section>
  )
}
