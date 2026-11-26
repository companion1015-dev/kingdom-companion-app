// App language — single source of truth for every language the app offers.
//
// ADD A LANGUAGE:   npm run i18n -- new <code> "<Native name>" "<English name>" <ltr|rtl>
// It adds the entry below, wires the dictionary, and scaffolds src/lib/i18n/messages/<code>.ts
// with every text to translate. See docs/i18n.md.
//
// status: 'live'   = reviewed by native speakers
//         'beta'   = offered, shown with a beta label
//         'hidden' = not offered yet (being translated / reviewed)

type LanguageBase = {
  code: string
  native: string // the language's own name, shown in the picker
  english: string
  dir: 'ltr' | 'rtl'
  status: 'live' | 'beta' | 'hidden'
  intl: string // locale tag for dates and numbers (Intl)
}
const defineLanguages = <T extends readonly LanguageBase[]>(list: T) => list

export const LANGUAGES = defineLanguages([
  { code: 'en', native: 'English', english: 'English', dir: 'ltr', status: 'live', intl: 'en' },
  { code: 'fr', native: 'Français', english: 'French', dir: 'ltr', status: 'beta', intl: 'fr' },
  { code: 'es', native: 'Español', english: 'Spanish', dir: 'ltr', status: 'beta', intl: 'es' },
  { code: 'ar', native: 'العربية', english: 'Arabic', dir: 'rtl', status: 'beta', intl: 'ar-u-nu-latn' },
  { code: 'ur', native: 'اردو', english: 'Urdu', dir: 'rtl', status: 'beta', intl: 'ur-PK' },
  // i18n:new-language
] as const)

export type LanguageInfo = (typeof LANGUAGES)[number]
export type LocaleCode = LanguageInfo['code']

export const DEFAULT_LOCALE: LocaleCode = 'en'
export const LOCALE_COOKIE = 'kc_lang'
/** "Device language": follow the phone/browser language automatically, like most popular apps. */
export const AUTO = 'auto'
export type LocalePreference = LocaleCode | typeof AUTO

export const isLocale = (v: unknown): v is LocaleCode => LANGUAGES.some(l => l.code === v)
export const isPreference = (v: unknown): v is LocalePreference => v === AUTO || isLocale(v)
export const languageOf = (c: LocaleCode): LanguageInfo => LANGUAGES.find(l => l.code === c) ?? LANGUAGES[0]
export const dirOf = (c: LocaleCode): 'ltr' | 'rtl' => languageOf(c).dir
const statusOf = (l: LanguageInfo): LanguageBase['status'] => l.status // widened: a language may be 'hidden' even if none is today
export const offeredLanguages = (): LanguageInfo[] => LANGUAGES.filter(l => statusOf(l) !== 'hidden')

/** Best offered language for a device's language list (navigator.languages). Exact match first, then base language. */
export function matchDeviceLanguage(tags: readonly string[]): LanguageInfo | null {
  const offered = offeredLanguages()
  for (const raw of tags) {
    const tag = raw.toLowerCase()
    const exact = offered.find(l => l.code.toLowerCase() === tag)
    if (exact) return exact
    const base = offered.find(l => l.code.toLowerCase().split('-')[0] === tag.split('-')[0])
    if (base) return base
  }
  return null
}

/** Tiny script run in <head> before first paint, so a saved right-to-left language never flashes left-to-right. */
export function languageBootScript(): string {
  const all = JSON.stringify(LANGUAGES.map(l => l.code))
  const offered = JSON.stringify(offeredLanguages().map(l => l.code))
  const rtl = JSON.stringify(LANGUAGES.filter(l => l.dir === 'rtl').map(l => l.code))
  return (
    `(function(){try{var m=document.cookie.match(/(?:^|; )${LOCALE_COOKIE}=([^;]*)/);if(!m)return;var c=decodeURIComponent(m[1]);` +
    `if(c==='${AUTO}'){var o=${offered},L=navigator.languages&&navigator.languages.length?navigator.languages:[navigator.language],f='';` +
    `for(var i=0;i<L.length&&!f;i++){var t=String(L[i]).toLowerCase(),b=t.split('-')[0];` +
    `for(var j=0;j<o.length&&!f;j++){if(o[j].toLowerCase()===t)f=o[j]}` +
    `for(var k=0;k<o.length&&!f;k++){if(o[k].toLowerCase().split('-')[0]===b)f=o[k]}}c=f||'${DEFAULT_LOCALE}'}` +
    `if(${all}.indexOf(c)<0)return;var d=document.documentElement;d.lang=c;d.dir=${rtl}.indexOf(c)>=0?'rtl':'ltr'}catch(e){}})()`
  )
}

/** The language to show for a preference ('auto' resolves from the device's language list). */
export function resolveLocale(pref: LocalePreference, deviceTags: readonly string[]): LocaleCode {
  return pref === AUTO ? matchDeviceLanguage(deviceTags)?.code ?? DEFAULT_LOCALE : pref
}
