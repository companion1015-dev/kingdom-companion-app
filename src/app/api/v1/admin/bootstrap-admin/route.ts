import { NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth/middleware'
import { prisma } from '@/lib/db/client'

export const POST = withAuth(async (_req, user) => {
  try {
    const anyAdmin = await prisma.user.findFirst({
      where: { role: { in: ['admin', 'super_admin'] } },
      select: { id: true },
    })
    if (anyAdmin) {
      return NextResponse.json(
        { success: false, message: 'An admin already exists. This bootstrap route only works when no admin exists yet.' },
        { status: 409 },
      )
    }

    const promoted = await prisma.user.update({
      where: { id: user.id },
      data: { role: 'admin' },
    })

    return NextResponse.json({
      success: true,
      message: 'You have been promoted to admin.',
      data: { email: promoted.email, role: promoted.role },
    })
  } catch (error) {
    console.error('bootstrap-admin error:', error)
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : 'Unknown error.' },
      { status: 500 },
    )
  }
})