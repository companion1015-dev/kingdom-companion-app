// One-off seed script for the "Kingdom Companion — Miracle & Transformation"
// 365-day Daily Encouragement upload pack (DailyGenerated model -- the same
// table /api/v1/daily reads from and falls back to AI generation for when a
// date has no row). Seeding these replaces the generic "A Word for Today"
// fallback rows with the real curated daily content for 2026-09-06 through
// 2027-09-05.
// Run with: node prisma/seed-kingdom-companion-daily-encouragement-365.mjs
//
// Follows the same PrismaPg-adapter pattern as src/lib/db/client.ts --
// `new PrismaClient()` with no adapter fails outright on Prisma 7.

import 'dotenv/config'
import { readFileSync } from 'node:fs'
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL })
const prisma = new PrismaClient({ adapter })

const entries = JSON.parse(
  readFileSync(new URL('./seed-data/kingdom-companion-daily-encouragement-365.json', import.meta.url))
)

if (entries.length !== 365) {
  throw new Error(`Expected 365 entries, found ${entries.length}.`)
}

let created = 0
let updated = 0

for (const e of entries) {
  const data = {
    date: e.date,
    verse_reference: e.verse_reference,
    verse_text: e.verse_text,
    translation: e.translation,
    book_id: e.book_id,
    chapter: e.chapter,
    title: e.title,
    reflection: e.reflection,
    prayer: e.prayer,
    challenge: e.challenge,
    reflection_question: e.reflection_question,
  }

  const existing = await prisma.dailyGenerated.findUnique({ where: { date: e.date } })

  if (existing) {
    await prisma.dailyGenerated.update({ where: { id: existing.id }, data })
    updated++
  } else {
    await prisma.dailyGenerated.create({ data })
    created++
  }
}

console.log(`Seeded Miracle & Transformation Daily Encouragement: ${created} created, ${updated} updated (365 total).`)
await prisma.$disconnect()
