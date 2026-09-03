const { PrismaClient, OrderStatus, DeliveryJobStatus } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  const driverId = '9929677c-1a15-4c9a-a7da-0bebfd4b4ac7';
  
  console.log('Testing exact Prisma query from getActiveJobs...');
  const jobs = await prisma.deliveryJob.findMany({
    where: {
      driverId: driverId,
      order: {
        status: {
          in: [
            OrderStatus.DRIVER_ASSIGNED,
            OrderStatus.ARRIVED_AT_RESTAURANT,
            OrderStatus.PICKED_UP,
            OrderStatus.OUT_FOR_DELIVERY,
          ],
        },
      },
    },
    include: { order: true }
  });
  
  console.log(`Query returned ${jobs.length} jobs.`);
  
  for (const job of jobs) {
    console.log(`- Job ${job.id} for Order ${job.order.orderNumber}`);
  }
}

run().catch(console.error).finally(() => prisma.$disconnect());
