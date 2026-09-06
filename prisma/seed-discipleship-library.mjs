// One-off seed script for the Discipleship Library (structured, readable
// teaching books distinct from the raw-file LibraryBook uploads at /books).
// Run with: node prisma/seed-discipleship-library.mjs
//
// Follows the same PrismaPg-adapter pattern as src/lib/db/client.ts —
// `new PrismaClient()` with no adapter fails outright on Prisma 7.

import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { book, chapters } from './seed-data/salvation-and-new-life-volume-1.mjs'

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
