// One-off seed script for the "Kingdom Companion | Integrated 365-Day
// Reading Journey" upload pack (ReadingPlan / ReadingDay / ReadingItem
// models). Ties together the Bible reading plan with the Discipleship
// Library (Volumes 1-3), the Daily Devotional, and the Daily Encouragement,
// day by day for a full year.
// Run with: node prisma/seed-integrated-365-day-reading-journey.mjs
//
// Follows the same PrismaPg-adapter pattern as src/lib/db/client.ts --
// `new PrismaClient()` with no adapter fails outright on Prisma 7.

import 'dotenv/config'
import { readFileSync } from 'node:fs'
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL })
const prisma = new PrismaClient({ adapter })

const { readingPlan, readingDays } = JSON.parse(
  readFileSync(new URL('./seed-data/kingdom-companion-integrated-365-day-reading-journey.json', import.meta.url))
)

if (readingDays.length !== 365) {
  throw new Error(`Expected 365 reading days, found ${readingDays.length}.`)
}

let plan = await prisma.readingPlan.findFirst({ where: { title: readingPlan.title } })

if (plan) {
  await prisma.readingPlan.update({
    where: { id: plan.id },
    data: {
      description: readingPlan.description,
      duration_days: readingPlan.duration_days,
      difficulty: readingPlan.difficulty,
      is_published: readingPlan.is_published,
    },
  })
  // Re-seed days/items from scratch so re-runs stay in sync with the pack.
  await prisma.readingDay.deleteMany({ where: { plan_id: plan.id } })
} else {
  plan = await prisma.readingPlan.create({
    data: {
      title: readingPlan.title,
      description: readingPlan.description,
      duration_days: readingPlan.duration_days,
      difficulty: readingPlan.difficulty,
      is_published: readingPlan.is_published,
    },
  })
}

const BATCH_SIZE = 10
let daysCreated = 0
let itemsCreated = 0

for (let i = 0; i < readingDays.length; i += BATCH_SIZE) {
  const batch = readingDays.slice(i, i + BATCH_SIZE)
  await prisma.$transaction(
    batch.map(day =>
      prisma.readingDay.create({
        data: {
          plan_id: plan.id,
          day_number: day.day_number,
          title: day.title,
          description: day.description,
          readings: {
            create: day.readingItems.map(item => ({
              book_id: item.book_id,
              chapter: item.chapter,
              sort_order: item.sort_order,
            })),
          },
        },
      }),
    ),
    { timeout: 20000 },
  )
  daysCreated += batch.length
  itemsCreated += batch.reduce((sum, d) => sum + d.readingItems.length, 0)
  if (daysCreated % 50 === 0) console.log(`...${daysCreated}/${readingDays.length} days`)
}

console.log(`Seeded Integrated 365-Day Reading Journey: plan ${plan.id}, ${daysCreated} days, ${itemsCreated} reading items.`)
await prisma.$disconnect()
