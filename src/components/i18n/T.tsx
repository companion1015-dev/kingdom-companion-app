'use client'
import { useI18n } from './I18nProvider'
import type { Values } from '@/lib/i18n'

// <T>English text</T> shows the text in the visitor's language, or the English original if no
// translation exists yet. Works inside server and client pages alike.
// A sentence with values is ONE text with named placeholders:  <T v={{ n: day }}>{'Day {n}'}</T>
// Text that must NEVER be translated (Scripture, names, copyright notices): put translate="no" on its element.
export default function T({ children, v }: { children: string; v?: Values }) {
  const { tr } = useI18n()
  return <>{tr(children, v)}</>
}

// For attributes (placeholder, aria-label, alt):  const tr = useTr();  <input placeholder={tr('Email')} />
export function useTr() {
  return useI18n().tr
}
