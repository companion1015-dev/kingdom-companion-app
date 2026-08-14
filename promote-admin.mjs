import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()
const email = process.argv[2]
const user = await prisma.user.update({
  where: { email },
  data: { role: 'admin' },
})
console.log('Promoted to admin:', user.email, '(role:', user.role + ')')
await prisma.$disconnect()
