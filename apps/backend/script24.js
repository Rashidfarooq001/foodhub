const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  const driver = await prisma.driver.findUnique({
    where: { id: '9929677c-1a15-4c9a-a7da-0bebfd4b4ac7' },
    include: { user: true }
  });
  console.log(JSON.stringify(driver, null, 2));
}

run()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
