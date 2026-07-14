import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const ownerPin = await bcrypt.hash('1234', 10)
  const employeePin = await bcrypt.hash('5678', 10)

  await prisma.user.upsert({
    where: { username: 'owner' },
    update: {},
    create: {
      username: 'owner',
      pin: ownerPin,
      name: 'Test Owner',
      role: 'OWNER',
    },
  })

  await prisma.user.upsert({
    where: { username: 'ahmed' },
    update: {},
    create: {
      username: 'ahmed',
      pin: employeePin,
      name: 'Ahmed',
      role: 'EMPLOYEE',
    },
  })

  console.log('Seeded: owner/1234, ahmed/5678')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())