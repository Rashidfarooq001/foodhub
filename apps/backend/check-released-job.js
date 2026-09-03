const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
async function run() {
  const driverId = '9929677c-1a15-4c9a-a7da-0bebfd4b4ac7'; // Muneeb
  const jobs = await p.deliveryJob.findMany({
    where: { driverId },
    include: { order: true }
  });
  console.log("Muneeb's current jobs:", jobs.map(j => ({ id: j.id, orderNumber: j.order.orderNumber, status: j.status })));
  
  const jobId = '80501344-1f08-4288-acab-d2b4f12edd13';
  const releasedJob = await p.deliveryJob.findUnique({
    where: { id: jobId },
    include: { order: true }
  });
  console.log("Released Job Status:", releasedJob.status);
  console.log("Released Job driverId:", releasedJob.driverId);
  console.log("Order Status:", releasedJob.order.status);
}
run().finally(() => p.$disconnect());
