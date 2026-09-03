const { PrismaClient } = require('@prisma/client');

async function bootstrap() {
  const prisma = new PrismaClient({
    datasourceUrl:
      'postgresql://neondb_owner:npg_iK4pyqYjFOb0@ep-empty-block-ayeiv0ux.c-5.us-east-2.aws.neon.tech/neondb?sslmode=require',
  });

  console.log('Finding potential orphans...');

  // Find users who are NOT admins
  const potentialOrphans = await prisma.user.findMany({
    where: {
      role: {
        notIn: ['ADMIN', 'SUPER_ADMIN'],
      },
    },
    include: {
      customer: true,
      driver: true,
      restaurantStaff: true,
    },
  });

  const orphansToDelete = [];

  for (const user of potentialOrphans) {
    const ownedRestaurants = await prisma.restaurant.count({
      where: { ownerId: user.id },
    });

    const hasCustomer = !!user.customer;
    const hasDriver = !!user.driver;
    const hasRestaurantStaff = user.restaurantStaff && user.restaurantStaff.length > 0;
    const hasOwnedRestaurant = ownedRestaurants > 0;

    if (!hasCustomer && !hasDriver && !hasRestaurantStaff && !hasOwnedRestaurant) {
      orphansToDelete.push(user);
    }
  }

  console.log(`Found ${orphansToDelete.length} orphaned User identities.`);

  if (orphansToDelete.length > 0) {
    console.log('Proceeding to safely delete orphaned identities...');
    let deletedCount = 0;

    for (const orphan of orphansToDelete) {
      try {
        await prisma.$transaction(async (tx) => {
          await tx.wallet.updateMany({
            where: { userId: orphan.id },
            data: { userId: null },
          });

          await tx.user.delete({
            where: { id: orphan.id },
          });
        });
        deletedCount++;
        console.log(`Successfully deleted orphaned user: ${orphan.email || orphan.phone}`);
      } catch (err) {
        console.error(`Failed to delete orphaned user ${orphan.id}:`, err.message);
      }
    }

    console.log(`Cleanup complete. Deleted ${deletedCount} orphans.`);
  }

  await prisma.$disconnect();
}

bootstrap();
