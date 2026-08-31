const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const driver = await prisma.driver.findFirst({
    include: { deliveryJobs: { include: { order: true } } }
  });
  console.dir(driver, { depth: null });
}
main().catch(console.error).finally(() => prisma.$disconnect());
