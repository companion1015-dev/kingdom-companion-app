import type { Metadata } from 'next'
import AICompanion from '@/modules/ai/components/AICompanion'

export const metadata: Metadata = {
  title: 'AI Spiritual Companion — Kingdom Companion',
  description: 'Share what is on your heart and receive Scripture-centred encouragement, reflection, and guided prayer. Always grounded in God\'s Word.',
}

export default function CompanionPage() {
  return <AICompanion />
}
