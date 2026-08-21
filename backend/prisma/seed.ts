import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const username = process.env.SEED_ADMIN_USERNAME ?? 'admin'
  const password = process.env.SEED_ADMIN_PASSWORD ?? 'admin123'

  const existing = await prisma.user.findUnique({ where: { username } })
  if (existing) {
    console.log(`Seed admin "${username}" already exists — skipping.`)
    return
  }

  const passwordHash = await bcrypt.hash(password, 12)
  // Epoch joinedAt so this account is always the earliest-joined admin,
  // making it "top admin" by default with no isBuiltIn special-casing.
  await prisma.user.create({
    data: {
      username,
      passwordHash,
      role: 'admin',
      joinedAt: new Date(0),
    },
  })
  console.log(`Seeded admin user "${username}".`)
}

main()
  .catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
