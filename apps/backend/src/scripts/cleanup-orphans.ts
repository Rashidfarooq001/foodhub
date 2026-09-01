import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { PrismaService } from '../modules/database/prisma.service';
import { UserRole } from '@prisma/client';

async function bootstrap() {
  console.log('Initializing Orphan Identity Cleanup Script...');
  const app = await NestFactory.createApplicationContext(AppModule);
  const prisma = app.get(PrismaService);

  console.log('Finding potential orphans...');

  // Find users who are NOT admins
  const potentialOrphans = await prisma.user.findMany({
    where: {
      role: {
        notIn: [UserRole.ADMIN, UserRole.SUPER_ADMIN],
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
    // Check if they own any restaurant
    const ownedRestaurants = await prisma.restaurant.count({
      where: { ownerId: user.id },
    });

    const hasCustomer = !!user.customer;
    const hasDriver = !!user.driver;
    const hasRestaurantStaff = user.restaurantStaff.length > 0;
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
          // Decouple wallet if any
          await tx.wallet.updateMany({
            where: { userId: orphan.id },
            data: { userId: null },
          });

          // Delete user (cascades to Profile, Sessions, etc.)
          await tx.user.delete({
            where: { id: orphan.id },
          });
        });
        deletedCount++;
        console.log(`Successfully deleted orphaned user: ${orphan.email || orphan.phone}`);
      } catch (err: any) {
        console.error(`Failed to delete orphaned user ${orphan.id}:`, err.message);
      }
    }

    console.log(`Cleanup complete. Deleted ${deletedCount} orphans.`);
  }

  await app.close();
}

bootstrap();
