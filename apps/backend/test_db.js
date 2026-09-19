const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const driverId = '9929677c-1a15-4c9a-a7da-0bebfd4b4ac7'; // Using one of the driver IDs
  const jobs = await prisma.deliveryJob.findMany({
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
        orderBy: { createdAt: 'desc' },
  });
  console.log(jobs);
}
main().catch(e => {
  console.error("ERROR", e);
}).finally(() => prisma.$disconnect());
