const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
async function run() {
  const driverId = '9929677c-1a15-4c9a-a7da-0bebfd4b4ac7'; // Muneeb
  const jobId = '80501344-1f08-4288-acab-d2b4f12edd13';
  const job = await p.deliveryJob.findUnique({ where: { id: jobId }});
  
  await p.deliveryJob.update({
    where: { id: jobId },
    data: { driverId, status: 'ASSIGNED' }
  });
  await p.order.update({
    where: { id: job.orderId },
    data: { status: 'DRIVER_ASSIGNED' }
  });
  console.log("Re-assigned FH-768759 to Muneeb");
}
run().finally(() => p.$disconnect());
