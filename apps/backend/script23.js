const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  const jobs = await prisma.deliveryJob.findMany({
    take: 5,
    orderBy: { createdAt: 'desc' },
    include: { order: { select: { id: true, status: true, assignedFoodHubDriverId: true, assignedRestaurantDriverId: true } } }
  });
  console.log(JSON.stringify(jobs, null, 2));
}

run()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
