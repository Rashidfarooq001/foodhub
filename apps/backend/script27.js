const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  const driverId = '9929677c-1a15-4c9a-a7da-0bebfd4b4ac7'; // Known assigned driver ID

  const job = await prisma.deliveryJob.findFirst({
    where: {
      driverId: driverId,
      order: {
        status: {
          in: [
            'DRIVER_ASSIGNED',
            'ARRIVED_AT_RESTAURANT',
            'PICKED_UP',
            'OUT_FOR_DELIVERY',
          ],
        },
      },
    },
    include: {
      order: {
        include: {
          restaurant: true,
          orderItems: { include: { foodItem: true } },
          customer: { include: { user: { include: { profile: true } } } },
        },
      },
    },
  });

  console.log('findFirst result:', job ? job.id : 'null');
}

run()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
