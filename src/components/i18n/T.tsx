'use client'
import { useI18n } from './I18nProvider'

// <T>English text</T> shows the text in the visitor's language, or the English original if no
// translation exists yet. Works inside server and client pages alike.
// Text that must NEVER be translated (Scripture, names): put translate="no" on its element.
export default function T({ children }: { children: string }) {
  const { tr } = useI18n()
  return <>{tr(children)}</>
}

// For attributes (placeholder, aria-label, alt):  const tr = useTr();  <input placeholder={tr('Email')} />
export function useTr() {
  return useI18n().tr
}
