const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('=== FOODHUB DATABASE INSPECTION REPORT ===\n');

  // 1. Inspect Admin Users
  const admins = await prisma.user.findMany({
    where: {
      role: {
        in: ['ADMIN', 'SUPER_ADMIN'],
      },
    },
    include: {
      profile: true,
    },
  });

  console.log(`Found ${admins.length} Admin User(s) to PRESERVE:`);
  admins.forEach((admin, i) => {
    console.log(`  [PRESERVED ADMIN #${i + 1}]`);
    console.log(`    User ID: ${admin.id}`);
    console.log(`    Phone:   ${admin.phone}`);
    console.log(`    Email:   ${admin.email || 'N/A'}`);
    console.log(`    Role:    ${admin.role}`);
    console.log(`    Name:    ${admin.profile ? `${admin.profile.firstName} ${admin.profile.lastName}` : 'N/A'}`);
  });

  const adminUserIds = admins.map((a) => a.id);

  // 2. Count rows in all tables
  const totalUsers = await prisma.user.count();
  const nonAdminUsers = await prisma.user.count({ where: { id: { notIn: adminUserIds } } });
  const adminProfilesCount = await prisma.profile.count({ where: { userId: { in: adminUserIds } } });
  const nonAdminProfilesCount = await prisma.profile.count({ where: { userId: { notIn: adminUserIds } } });

  const counts = {
    'Admin Users (TO PRESERVE)': admins.length,
    'Admin Profiles (TO PRESERVE)': adminProfilesCount,
    'Non-Admin Users (TO DELETE)': nonAdminUsers,
    'Non-Admin Profiles (TO DELETE)': nonAdminProfilesCount,
    'Customers (TO DELETE)': await prisma.customer.count(),
    'Customer Addresses (TO DELETE)': await prisma.customerAddress.count(),
    'Carts (TO DELETE)': await prisma.cart.count(),
    'Cart Items (TO DELETE)': await prisma.cartItem.count(),
    'Restaurants (TO DELETE)': await prisma.restaurant.count(),
    'Restaurant Categories (TO DELETE)': await prisma.restaurantCategory.count(),
    'Food Items (TO DELETE)': await prisma.foodItem.count(),
    'Food Variants (TO DELETE)': await prisma.foodVariant.count(),
    'Addon Groups (TO DELETE)': await prisma.addonGroup.count(),
    'Food Addons (TO DELETE)': await prisma.foodAddon.count(),
    'Restaurant Staff (TO DELETE)': await prisma.restaurantStaff.count(),
    'Drivers (TO DELETE)': await prisma.driver.count(),
    'Driver Vehicles (TO DELETE)': await prisma.driverVehicle.count(),
    'Orders (TO DELETE)': await prisma.order.count(),
    'Order Items (TO DELETE)': await prisma.orderItem.count(),
    'Order Trackings (TO DELETE)': await prisma.orderTracking.count(),
    'Order Status Logs (TO DELETE)': await prisma.orderStatusLog.count(),
    'Restaurant Reviews (TO DELETE)': await prisma.restaurantReview.count(),
    'Food Reviews (TO DELETE)': await prisma.foodReview.count(),
    'Driver Reviews (TO DELETE)': await prisma.driverReview.count(),
    'Coupons (TO DELETE)': await prisma.coupon.count(),
    'Coupon Usages (TO DELETE)': await prisma.couponUsage.count(),
    'Payments (TO DELETE)': await prisma.payment.count(),
    'Non-Admin Wallets (TO DELETE)': await prisma.wallet.count({ where: { userId: { notIn: adminUserIds } } }),
    'Non-Admin Wallet Transactions (TO DELETE)': await prisma.walletTransaction.count({ where: { wallet: { userId: { notIn: adminUserIds } } } }),
    'Notifications (TO DELETE)': await prisma.notification.count(),
    'Audit Logs (TO DELETE)': await prisma.auditLog.count({ where: { userId: { notIn: adminUserIds } } }),
  };

  console.log('\n=== ROW CLEANUP SUMMARY REPORT ===');
  for (const [table, count] of Object.entries(counts)) {
    console.log(`  - ${table}: ${count}`);
  }
}

main()
  .catch((e) => {
    console.error('Error during database inspection:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
