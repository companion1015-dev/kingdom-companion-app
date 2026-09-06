// One-off seed script for "Spiritual Growth & Christian Living" (Volume 2).
// Run with: node prisma/seed-discipleship-library-volume-2.mjs

import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { book, chapters } from './seed-data/spiritual-growth-and-christian-living-volume-2.mjs'

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL })
const prisma = new PrismaClient({ adapter })

const savedBook = await prisma.discipleshipBook.upsert({
  where: { slug: book.slug },
  create: book,
  update: book,
})

for (const chapter of chapters) {
  await prisma.discipleshipChapter.upsert({
    where: { book_id_chapter_number: { book_id: savedBook.id, chapter_number: chapter.chapter_number } },
    create: { ...chapter, book_id: savedBook.id },
    update: chapter,
  })
}

console.log(`Seeded "${savedBook.title} — ${savedBook.subtitle}" (${chapters.length} chapters).`)
await prisma.$disconnect()
