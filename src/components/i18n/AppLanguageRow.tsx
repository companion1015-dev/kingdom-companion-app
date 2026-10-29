'use client'
import Link from 'next/link'
import { Globe } from 'lucide-react'
import { AUTO, languageOf } from '@/lib/i18n'
import { useI18n } from './I18nProvider'

// The "App language" setting row, used inside the Profile page.
export default function AppLanguageRow() {
  const { locale, preference, tr } = useI18n()
  const current = languageOf(locale)
  return (
    <div>
      <label className="block text-xs font-body font-semibold text-navy/50 dark:text-cream/50 tracking-wider uppercase mb-1.5">{tr('App language')}</label>
      <Link href="/settings/language"
        className="flex items-center justify-between gap-3 px-4 py-3 min-h-[44px] rounded-xl border border-navy/12 text-sm font-body text-charcoal/70 dark:text-cream/70 hover:border-navy/30 transition-all">
        <span className="flex items-center gap-2"><Globe className="w-4 h-4" aria-hidden="true" /><span lang={current.code}>{preference === AUTO ? tr('Device language') + ' · ' : ''}{current.native}</span></span>
        <span aria-hidden="true" className="opacity-50 rtl:rotate-180">›</span>
      </Link>
    </div>
  )
}
