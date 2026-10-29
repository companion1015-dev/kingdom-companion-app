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

export function translate(locale: LocaleCode, text: string): string {
  if (locale === 'en') return text
  const found = dictionaries[locale]?.[text]
  return found ? found : text
}
