import LanguagePicker from '@/components/i18n/LanguagePicker'

export const metadata = { title: 'Language' }

export default function LanguageSettingsPage() {
  return (
    <main className="px-4 py-8 max-w-2xl mx-auto">
      <LanguagePicker />
    </main>
  )
}
