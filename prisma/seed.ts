import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const adminEmail = 'admin@example.com';
  
  const existingAdmin = await prisma.user.findUnique({ where: { email: adminEmail } });
  
  if (!existingAdmin) {
    await prisma.user.create({
      data: {
        email: adminEmail,
        passwordHash: 'dummy_hash_change_in_production', // In real app, bcrypt hash this
        role: 'ADMIN',
        preferences: JSON.stringify({
          theme: 'dark',
          accentColor: '#e50914'
        })
      }
    });
    console.log('Created admin user: admin@example.com');
  } else {
    console.log('Admin user already exists');
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
