const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({
  datasourceUrl:
    'postgresql://neondb_owner:npg_iK4pyqYjFOb0@ep-empty-block-ayeiv0ux.c-5.us-east-2.aws.neon.tech/neondb?sslmode=require',
});

async function run() {
  const id = '5aad6d8f-84ca-4887-9849-ae2efa4a0e70';

  try {
    const prevRestaurant = await prisma.restaurant.findUnique({
      where: { id },
      select: { id: true, name: true, status: true, ownerId: true },
    });

    if (!prevRestaurant) {
      console.log(`Restaurant ${id} not found.`);
      return;
    }

    const previousStatus = prevRestaurant.status;
    let prismaStatus = 'APPROVED';
    const isOpen = prismaStatus === 'APPROVED';

    const restaurant = await prisma.restaurant.update({
      where: { id },
      data: {
        status: prismaStatus,
        isOpen,
        rejectionReason: null,
      },
    });

    console.log('Restaurant updated successfully:', restaurant.status);
  } catch (error) {
    console.error('Error updating restaurant:', error);
  }

  await prisma.$disconnect();
}

run();
