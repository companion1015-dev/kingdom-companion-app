// Interface languages and strings in ONE file.
// Add a language: add an entry to LANGUAGES and one object to CATALOGUES.
// status: 'live' = reviewed by a native speaker; 'beta' = drafted, not yet reviewed.
export type LocaleCode = 'en' | 'fr' | 'es' | 'ar' | 'ur'
export type LanguageInfo = { code: LocaleCode; native: string; english: string; dir: 'ltr' | 'rtl'; status: 'live' | 'beta' }

export const LANGUAGES: LanguageInfo[] = [
  { code: 'en', native: 'English',  english: 'English', dir: 'ltr', status: 'live' },
  { code: 'fr', native: 'Français', english: 'French',  dir: 'ltr', status: 'beta' },
  { code: 'es', native: 'Español',  english: 'Spanish', dir: 'ltr', status: 'beta' },
  { code: 'ar', native: 'العربية',  english: 'Arabic',  dir: 'rtl', status: 'beta' },
  { code: 'ur', native: 'اردو',     english: 'Urdu',    dir: 'rtl', status: 'beta' },
]
export const DEFAULT_LOCALE: LocaleCode = 'en'
export const LOCALE_COOKIE = 'kc_lang'
export const isLocale = (v: unknown): v is LocaleCode => LANGUAGES.some(l => l.code === v)
export const dirOf = (c: LocaleCode) => LANGUAGES.find(l => l.code === c)?.dir ?? 'ltr'

const en = {
  'lang.interface': 'App language',
  'nav.language': 'Language',
  'lang.help': 'Choose the language for menus and buttons. Your choice is saved to your account.',
  'lang.beta': 'Beta: wording not yet reviewed by a native speaker',
  'lang.saved': 'Saved',
  'lang.saveFailed': 'Could not save to your account. Your choice still applies on this device.',
  'lang.bibleNote': 'Bible text comes from licensed Bible versions and is never machine-translated.',
}
export type MessageKey = keyof typeof en
type Messages = Record<MessageKey, string>

const fr: Messages = {
  'lang.interface': "Langue de l'application",
  'nav.language': 'Langue',
  'lang.help': 'Choisissez la langue des menus et des boutons. Votre choix est enregistré dans votre compte.',
  'lang.beta': 'Bêta : formulation pas encore relue par un locuteur natif',
  'lang.saved': 'Enregistré',
  'lang.saveFailed': "Impossible d'enregistrer dans votre compte. Votre choix s'applique quand même sur cet appareil.",
  'lang.bibleNote': "Le texte biblique provient de versions bibliques sous licence et n'est jamais traduit automatiquement.",
}
const es: Messages = {
  'lang.interface': 'Idioma de la aplicación',
  'nav.language': 'Idioma',
  'lang.help': 'Elige el idioma de los menús y botones. Tu elección se guarda en tu cuenta.',
  'lang.beta': 'Beta: redacción aún no revisada por un hablante nativo',
  'lang.saved': 'Guardado',
  'lang.saveFailed': 'No se pudo guardar en tu cuenta. Tu elección sigue aplicándose en este dispositivo.',
  'lang.bibleNote': 'El texto bíblico proviene de versiones bíblicas con licencia y nunca se traduce automáticamente.',
}
const ar: Messages = {
  'lang.interface': 'لغة التطبيق',
  'nav.language': 'اللغة',
  'lang.help': 'اختر لغة القوائم والأزرار. يتم حفظ اختيارك في حسابك.',
  'lang.beta': 'تجريبي: لم تتم مراجعة الصياغة بعد من قِبل ناطق أصلي',
  'lang.saved': 'تم الحفظ',
  'lang.saveFailed': 'تعذر الحفظ في حسابك. سيظل اختيارك مطبقاً على هذا الجهاز.',
  'lang.bibleNote': 'نص الكتاب المقدس مأخوذ من نسخ مرخّصة ولا يُترجم آلياً أبداً.',
}
const ur: Messages = {
  'lang.interface': 'ایپ کی زبان',
  'nav.language': 'زبان',
  'lang.help': 'مینو اور بٹنوں کی زبان منتخب کریں۔ آپ کا انتخاب آپ کے اکاؤنٹ میں محفوظ ہو جاتا ہے۔',
  'lang.beta': 'بیٹا: الفاظ پر ابھی کسی اہلِ زبان نے نظرثانی نہیں کی',
  'lang.saved': 'محفوظ ہو گیا',
  'lang.saveFailed': 'آپ کے اکاؤنٹ میں محفوظ نہیں ہو سکا۔ آپ کا انتخاب اس ڈیوائس پر پھر بھی لاگو رہے گا۔',
  'lang.bibleNote': 'بائبل کا متن لائسنس یافتہ بائبل ورژنز سے لیا جاتا ہے اور کبھی خودکار ترجمہ نہیں ہوتا۔',
}
const CATALOGUES: Record<LocaleCode, Messages> = { en, fr, es, ar, ur }

// Missing keys fall back to English, never to a raw key.
export function translate(locale: LocaleCode, key: MessageKey): string {
  return CATALOGUES[locale]?.[key] ?? en[key] ?? key
}
