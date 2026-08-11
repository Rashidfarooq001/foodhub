const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    take: 50,
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      phone: true,
      email: true,
      role: true,
      isVerified: true,
      isActive: true,
      createdAt: true,
    },
  });

  console.log('--- RECENT USERS IN DB ---');
  users.forEach((u) => {
    console.log(`ID: ${u.id} | Phone: "${u.phone}" | Role: ${u.role} | Verified: ${u.isVerified} | Active: ${u.isActive}`);
  });
}

main()
  .catch((e) => console.error(e))
  .finally(async () => await prisma.$disconnect());
