const { PrismaClient, OrderStatus } = require('@prisma/client');
const p = new PrismaClient();
async function run() {
  const driverId = '9929677c-1a15-4c9a-a7da-0bebfd4b4ac7';
  const jobs = await p.deliveryJob.findMany({
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
    include: {
      order: { select: { id: true, orderNumber: true, status: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
  console.log('QUERY RESULT COUNT: ' + jobs.length);
  for (const j of jobs) {
    console.log('  Job: ' + j.id + ' | Order: ' + j.order.orderNumber + ' | OrderStatus: ' + j.order.status + ' | JobStatus: ' + j.status);
  }
}
run().catch(e => console.error(e.message)).finally(() => p.$disconnect());
