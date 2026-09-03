const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function run() {
  const admin = await prisma.user.findFirst({ where: { role: 'SUPER_ADMIN' } });
  console.log("Admin ID:", admin.id);
  await prisma.$disconnect();
}
run();
