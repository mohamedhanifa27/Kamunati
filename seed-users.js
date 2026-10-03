const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const adminPassword = await bcrypt.hash('admin123', 10);
  const testerPassword = await bcrypt.hash('tester123', 10);

  // Strictly wipe any other users
  await prisma.user.deleteMany({
    where: {
      email: {
        notIn: ['admin@kamunati.com', 'testerprime@kamunati.com']
      }
    }
  });

  // Upsert Admin
  const admin = await prisma.user.upsert({
    where: { email: 'admin@kamunati.com' },
    update: {},
    create: {
      email: 'admin@kamunati.com',
      passwordHash: adminPassword,
      role: 'ADMIN',
    },
  });

  // Upsert Tester Prime
  const tester = await prisma.user.upsert({
    where: { email: 'testerprime@kamunati.com' },
    update: {},
    create: {
      email: 'testerprime@kamunati.com',
      passwordHash: testerPassword,
      role: 'USER',
    },
  });

  console.log('Database seeded successfully!');
  console.log('Admin:', admin.email);
  console.log('Tester:', tester.email);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
