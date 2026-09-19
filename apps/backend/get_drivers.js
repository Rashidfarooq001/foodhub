const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const drivers = await prisma.driver.findMany({
    include: { user: { select: { email: true, phone: true } } }
  });
  console.log('Drivers:', drivers);
}
main().catch(console.error).finally(() => prisma.$disconnect());
