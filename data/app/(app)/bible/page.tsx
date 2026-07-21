import type { Metadata } from 'next'
import BibleReader from '@/modules/bible/components/BibleReader'

export const metadata: Metadata = {
  title: 'Bible Reader — Kingdom Companion',
  description: 'Read the Bible in multiple translations. Navigate by book and chapter, highlight verses, add notes, and study with AI assistance.',
}

export default function BiblePage() {
  return <BibleReader />
}
