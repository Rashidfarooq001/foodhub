const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
async function run() {
  const driverId = '9929677c-1a15-4c9a-a7da-0bebfd4b4ac7'; // Muneeb
  const jobs = await p.deliveryJob.findMany({
    where: { driverId },
    include: { order: true }
  });
  console.log(jobs.map(j => ({ id: j.id, orderNumber: j.order.orderNumber, status: j.status })));
}
run().finally(() => p.$disconnect());
