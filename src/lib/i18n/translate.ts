// Translation lookup. English is the source language: the English text IS the key.
// A text with no translation falls back to the English original — never a blank or a code.
import type { LocaleCode } from './config'
import fr from './messages/fr'
import es from './messages/es'
import ar from './messages/ar'
import ur from './messages/ur'
// i18n:imports

export type Dictionary = Record<string, string>

// The compiler requires an entry here for every language in config.ts (except English).
export const dictionaries: Record<Exclude<LocaleCode, 'en'>, Dictionary> = {
  fr,
  es,
  ar,
  ur,
  // i18n:dictionaries
}

export type Values = Record<string, string | number>

// Sentences with values use named placeholders: translate(locale, 'Day {n} of {total}', { n: 3, total: 40 }).
// Translators may move {n} and {total} anywhere in the sentence (needed for Arabic and Urdu word order).
const fill = (text: string, values?: Values) =>
  values ? text.replace(/\{(\w+)\}/g, (m, k: string) => (k in values ? String(values[k]) : m)) : text

export function translate(locale: LocaleCode, text: string, values?: Values): string {
  if (locale === 'en') return fill(text, values)
  const found = dictionaries[locale]?.[text]
  return fill(found ? found : text, values)
}
