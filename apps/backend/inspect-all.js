const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('=== FOODHUB DATABASE PRESERVATION & CLEANUP REPORT ===\n');

  // 1. Identify Admin User(s)
  const adminUsers = await prisma.user.findMany({
    where: {
      role: {
        in: ['ADMIN', 'SUPER_ADMIN'],
      },
    },
    include: {
      profile: true,
    },
  });

  console.log('----------------------------------------------------');
  console.log('1. PRESERVED ADMIN ACCOUNT(S) (WILL NOT BE DELETED)');
  console.log('----------------------------------------------------');
  adminUsers.forEach((admin, i) => {
    console.log(`  ✓ Admin #${i + 1}:`);
    console.log(`      ID:       ${admin.id}`);
    console.log(`      Phone:    ${admin.phone}`);
    console.log(`      Email:    ${admin.email || 'N/A'}`);
    console.log(`      Role:     ${admin.role}`);
    console.log(
      `      Name:     ${admin.profile ? `${admin.profile.firstName} ${admin.profile.lastName}` : 'N/A'}`,
    );
    console.log(`      Status:   ACTIVE / PRESERVED ✅`);
  });

  const adminUserIds = adminUsers.map((a) => a.id);

  // 2. Count rows per table using safe Prisma model queries
  const counts = {};

  const safeCount = async (modelName, query = {}) => {
    try {
      if (prisma[modelName] && typeof prisma[modelName].count === 'function') {
        return await prisma[modelName].count(query);
      }
    } catch {
      /* ignore */
    }
    return 0;
  };

  counts['Admin Users (TO PRESERVE)'] = adminUsers.length;
  counts['Admin Profiles (TO PRESERVE)'] = await safeCount('profile', {
    where: { userId: { in: adminUserIds } },
  });

  counts['Non-Admin Users (TO DELETE)'] = await safeCount('user', {
    where: { id: { notIn: adminUserIds } },
  });
  counts['Non-Admin Profiles (TO DELETE)'] = await safeCount('profile', {
    where: { userId: { notIn: adminUserIds } },
  });

  counts['Customers (TO DELETE)'] = await safeCount('customer');
  counts['Customer Addresses (TO DELETE)'] = await safeCount('customerAddress');
  counts['Carts (TO DELETE)'] = await safeCount('cart');
  counts['Cart Items (TO DELETE)'] = await safeCount('cartItem');

  counts['Restaurants (TO DELETE)'] = await safeCount('restaurant');
  counts['Restaurant Categories (TO DELETE)'] = await safeCount('restaurantCategory');
  counts['Food Items (TO DELETE)'] = await safeCount('foodItem');
  counts['Food Variants (TO DELETE)'] = await safeCount('foodVariant');
  counts['Addon Groups (TO DELETE)'] = await safeCount('addonGroup');
  counts['Food Addons (TO DELETE)'] = await safeCount('foodAddon');
  counts['Restaurant Staff (TO DELETE)'] = await safeCount('restaurantStaff');

  counts['Drivers (TO DELETE)'] = await safeCount('driver');

  counts['Orders (TO DELETE)'] = await safeCount('order');
  counts['Order Items (TO DELETE)'] = await safeCount('orderItem');
  counts['Order Trackings (TO DELETE)'] = await safeCount('orderTracking');
  counts['Order Status Logs (TO DELETE)'] = await safeCount('orderStatusLog');

  counts['Restaurant Reviews (TO DELETE)'] = await safeCount('restaurantReview');
  counts['Food Reviews (TO DELETE)'] = await safeCount('foodReview');
  counts['Driver Reviews (TO DELETE)'] = await safeCount('driverReview');

  counts['Coupons (TO DELETE)'] = await safeCount('coupon');
  counts['Coupon Usages (TO DELETE)'] = await safeCount('couponUsage');
  counts['Payments (TO DELETE)'] = await safeCount('payment');
  counts['Wallets (TO DELETE)'] = await safeCount('wallet', {
    where: { userId: { notIn: adminUserIds } },
  });
  counts['Wallet Transactions (TO DELETE)'] = await safeCount('walletTransaction');
  counts['Notifications (TO DELETE)'] = await safeCount('notification');
  counts['Audit Logs (TO DELETE)'] = await safeCount('auditLog', {
    where: { userId: { notIn: adminUserIds } },
  });

  console.log('\n----------------------------------------------------');
  console.log('2. DATA CLEANUP SCOPE (ROW COUNTS TO BE CLEANED)');
  console.log('----------------------------------------------------');
  for (const [table, count] of Object.entries(counts)) {
    console.log(`  - ${table}: ${count}`);
  }

  // Raw PostgreSQL table list verification
  const tables = await prisma.$queryRaw`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
    ORDER BY table_name;
  `;

  console.log('\n----------------------------------------------------');
  console.log('3. POSTGRESQL TABLES VERIFIED (STRUCTURAL PRESERVATION)');
  console.log('----------------------------------------------------');
  tables.forEach((t) => {
    console.log(`  ✓ Table '${t.table_name}' — PRESERVED STRUCTURALLY ✅`);
  });
}

main()
  .catch((e) => {
    console.error('Error during database inspection:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
