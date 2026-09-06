// One-off seed script for the "Kingdom Companion — Miracle Journey" 365-day
// devotional series (DevotionalSeries / DevotionalEntry models — the
// multi-day Devotional Library, distinct from the Discipleship Library
// books seeded by seed-discipleship-library*.mjs).
// Run with: node prisma/seed-kingdom-companion-miracle-journey-365.mjs
//
// Follows the same PrismaPg-adapter pattern as src/lib/db/client.ts —
// `new PrismaClient()` with no adapter fails outright on Prisma 7.

import 'dotenv/config'
import { readFileSync } from 'node:fs'
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL })
const prisma = new PrismaClient({ adapter })

const entries = JSON.parse(
  readFileSync(new URL('./seed-data/kingdom-companion-miracle-journey-365.json', import.meta.url))
)

if (entries.length !== 365) {
  throw new Error(`Expected 365 entries, found ${entries.length}.`)
}

const series = await prisma.devotionalSeries.upsert({
  where: { slug: 'kingdom-companion-miracle-journey' },
  create: {
    slug: 'kingdom-companion-miracle-journey',
    title: 'Kingdom Companion — Miracle Journey',
    category: 'Miracle Journey',
    description:
      'A 365-day journey through Foundation, Faith, Inner Life, Prayer, Wisdom, Relationships, Purpose, Overcoming, Wholeness, Leadership, Kingdom Impact, and Maturity — one theme, one scripture, one prayer, and one step of obedience at a time.',
    duration_days: 365,
    is_published: true,
  },
  update: {},
})

let created = 0
let updated = 0

for (const e of entries) {
  const data = {
    devotional_series_id: series.id,
    day_number: e.day_number,
    title: e.title,
    theme: e.theme,
    translation_id: e.translation_id,
    book_id: e.book_id,
    chapter: e.chapter,
    central_verse_id: e.central_verse_id,
    central_verse_reference: e.central_verse_reference,
    reflection: e.reflection,
    guided_prayer: e.guided_prayer,
    practical_application: e.practical_application,
    is_ai_generated: true,
    ai_disclosure_text:
      'This devotional was thoughtfully composed with AI assistance and reviewed for biblical accuracy and pastoral tone.',
  }

  const existing = await prisma.devotionalEntry.findUnique({
    where: { devotional_series_id_day_number: { devotional_series_id: series.id, day_number: e.day_number } },
  })

  if (existing) {
    await prisma.devotionalEntry.update({ where: { id: existing.id }, data })
    updated++
  } else {
    await prisma.devotionalEntry.create({ data })
    created++
  }
}

console.log(`Seeded "${series.title}": ${created} entries created, ${updated} updated (365 total).`)
await prisma.$disconnect()
