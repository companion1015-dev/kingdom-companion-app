import { NextResponse } from 'next/server'
import { withAdmin } from '@/lib/auth/middleware'
import { prisma } from '@/lib/db/client'
import { buildReadingPlanData } from '@/modules/reading-plans/data/generator'

export const POST = withAdmin(async () => {
  try {
    const { readingPlan, readingDays } = buildReadingPlanData()

    const existing = await prisma.readingPlan.findFirst({
      where: { title: readingPlan.title },
      select: { id: true },
    })
    if (existing) {
      return NextResponse.json(
        {
          success: false,
          message: `A reading plan titled "${readingPlan.title}" already exists (id: ${existing.id}). Delete it first if you want to re-seed.`,
        },
        { status: 409 },
      )
    }

    const plan = await prisma.readingPlan.create({
      data: {
        title: readingPlan.title,
        description: readingPlan.description,
        duration_days: readingPlan.duration_days,
        difficulty: readingPlan.difficulty,
        is_published: readingPlan.is_published,
      },
    })

    const BATCH_SIZE = 25
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
      )
      daysCreated += batch.length
      itemsCreated += batch.reduce((sum, d) => sum + d.readingItems.length, 0)
    }

    return NextResponse.json({
      success: true,
      message: 'Reading plan seeded successfully.',
      data: {
        planId: plan.id,
        title: plan.title,
        daysCreated,
        itemsCreated,
      },
    })
  } catch (error) {
    console.error('seed-reading-plan error:', error)
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error seeding reading plan.',
      },
      { status: 500 },
    )
  }
})