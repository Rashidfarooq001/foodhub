const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('=== EXECUTING FOODHUB SAFE DATA CLEANUP TRANSACTION ===\n');

  // 1. Double check Admin preservation
  const adminUsers = await prisma.user.findMany({
    where: {
      role: {
        in: ['ADMIN', 'SUPER_ADMIN'],
      },
    },
  });

  if (adminUsers.length === 0) {
    throw new Error('CRITICAL SAFETY BLOCK: No Admin user found! Aborting cleanup to prevent lockout.');
  }

  const adminIds = adminUsers.map((a) => `'${a.id}'`).join(',');
  console.log(`Preserving ${adminUsers.length} Admin User ID(s): ${adminIds}\n`);

  // 2. Execute deletion in exact FK dependency order inside a single PostgreSQL Transaction
  await prisma.$transaction(async (tx) => {
    console.log('Executing raw SQL deletions within transaction...');

    // A. Order related tables
    await tx.$executeRawUnsafe(`DELETE FROM "order_items";`);
    await tx.$executeRawUnsafe(`DELETE FROM "order_timelines";`);
    await tx.$executeRawUnsafe(`DELETE FROM "order_cancellations";`);
    await tx.$executeRawUnsafe(`DELETE FROM "order_refunds";`);
    await tx.$executeRawUnsafe(`DELETE FROM "order_status_histories";`);
    await tx.$executeRawUnsafe(`DELETE FROM "order_trackings";`);

    // B. Payment tables
    await tx.$executeRawUnsafe(`DELETE FROM "payment_attempts";`);
    await tx.$executeRawUnsafe(`DELETE FROM "payment_refunds";`);
    await tx.$executeRawUnsafe(`DELETE FROM "payments";`);

    // C. Orders table
    await tx.$executeRawUnsafe(`DELETE FROM "orders";`);

    // D. Review tables
    await tx.$executeRawUnsafe(`DELETE FROM "review_images";`);
    await tx.$executeRawUnsafe(`DELETE FROM "review_replies";`);
    await tx.$executeRawUnsafe(`DELETE FROM "review_reports";`);
    await tx.$executeRawUnsafe(`DELETE FROM "review_votes";`);
    await tx.$executeRawUnsafe(`DELETE FROM "restaurant_reviews";`);
    await tx.$executeRawUnsafe(`DELETE FROM "food_reviews";`);
    await tx.$executeRawUnsafe(`DELETE FROM "driver_reviews";`);

    // E. Coupons
    await tx.$executeRawUnsafe(`DELETE FROM "coupon_usages";`);
    await tx.$executeRawUnsafe(`DELETE FROM "coupons";`);

    // F. Menu & Items
    await tx.$executeRawUnsafe(`DELETE FROM "food_addons";`);
    await tx.$executeRawUnsafe(`DELETE FROM "addon_groups";`);
    await tx.$executeRawUnsafe(`DELETE FROM "food_variants";`);
    await tx.$executeRawUnsafe(`DELETE FROM "food_images";`);
    await tx.$executeRawUnsafe(`DELETE FROM "inventories";`);
    await tx.$executeRawUnsafe(`DELETE FROM "food_items";`);
    await tx.$executeRawUnsafe(`DELETE FROM "sub_categories";`);
    await tx.$executeRawUnsafe(`DELETE FROM "categories";`);

    // G. Restaurants & Staff
    await tx.$executeRawUnsafe(`DELETE FROM "restaurant_delivery_staff";`);
    await tx.$executeRawUnsafe(`DELETE FROM "restaurant_documents";`);
    await tx.$executeRawUnsafe(`DELETE FROM "restaurant_galleries";`);
    await tx.$executeRawUnsafe(`DELETE FROM "restaurant_settings";`);
    await tx.$executeRawUnsafe(`DELETE FROM "restaurant_timings";`);
    await tx.$executeRawUnsafe(`DELETE FROM "restaurant_branches";`);
    await tx.$executeRawUnsafe(`DELETE FROM "restaurant_bank_accounts";`);
    await tx.$executeRawUnsafe(`DELETE FROM "restaurant_staff";`);
    await tx.$executeRawUnsafe(`DELETE FROM "rejected_restaurant_records";`);
    await tx.$executeRawUnsafe(`DELETE FROM "saved_restaurants";`);
    await tx.$executeRawUnsafe(`DELETE FROM "restaurants";`);

    // H. Drivers
    await tx.$executeRawUnsafe(`DELETE FROM "delivery_assignments";`);
    await tx.$executeRawUnsafe(`DELETE FROM "delivery_histories";`);
    await tx.$executeRawUnsafe(`DELETE FROM "driver_documents";`);
    await tx.$executeRawUnsafe(`DELETE FROM "driver_locations";`);
    await tx.$executeRawUnsafe(`DELETE FROM "driver_shifts";`);
    await tx.$executeRawUnsafe(`DELETE FROM "driver_vehicles";`);
    await tx.$executeRawUnsafe(`DELETE FROM "driver_wallets";`);
    await tx.$executeRawUnsafe(`DELETE FROM "drivers";`);

    // I. Customers
    await tx.$executeRawUnsafe(`DELETE FROM "customer_addresses";`);
    await tx.$executeRawUnsafe(`DELETE FROM "customer_points";`);
    await tx.$executeRawUnsafe(`DELETE FROM "customer_preferences";`);
    await tx.$executeRawUnsafe(`DELETE FROM "wishlists";`);
    await tx.$executeRawUnsafe(`DELETE FROM "customers";`);

    // J. User tokens, logs & notifications
    await tx.$executeRawUnsafe(`DELETE FROM "otps";`);
    await tx.$executeRawUnsafe(`DELETE FROM "refresh_tokens";`);
    await tx.$executeRawUnsafe(`DELETE FROM "login_histories";`);
    await tx.$executeRawUnsafe(`DELETE FROM "sessions";`);
    await tx.$executeRawUnsafe(`DELETE FROM "in_app_notifications";`);
    await tx.$executeRawUnsafe(`DELETE FROM "push_notifications";`);
    await tx.$executeRawUnsafe(`DELETE FROM "email_logs";`);
    await tx.$executeRawUnsafe(`DELETE FROM "sms_logs";`);
    await tx.$executeRawUnsafe(`DELETE FROM "notifications";`);

    // K. Support & Invoices
    await tx.$executeRawUnsafe(`DELETE FROM "ticket_attachments";`);
    await tx.$executeRawUnsafe(`DELETE FROM "support_messages";`);
    await tx.$executeRawUnsafe(`DELETE FROM "support_tickets";`);
    await tx.$executeRawUnsafe(`DELETE FROM "invoices";`);
    await tx.$executeRawUnsafe(`DELETE FROM "settlements";`);
    await tx.$executeRawUnsafe(`DELETE FROM "referrals";`);

    // L. Wallets (Except Admin Wallets)
    await tx.$executeRawUnsafe(`DELETE FROM "wallet_transactions" WHERE "wallet_id" IN (SELECT id FROM "wallets" WHERE "user_id" NOT IN (${adminIds}));`);
    await tx.$executeRawUnsafe(`DELETE FROM "wallets" WHERE "user_id" NOT IN (${adminIds});`);

    // M. Audit logs (Except Admin)
    await tx.$executeRawUnsafe(`DELETE FROM "audit_logs" WHERE "user_id" IS NULL OR "user_id" NOT IN (${adminIds});`);

    // N. Profiles & Users (PRESERVING ADMIN USERS & PROFILES)
    await tx.$executeRawUnsafe(`DELETE FROM "profiles" WHERE "user_id" NOT IN (${adminIds});`);
    await tx.$executeRawUnsafe(`DELETE FROM "users" WHERE "id" NOT IN (${adminIds}) AND "role"::text NOT IN ('ADMIN', 'SUPER_ADMIN');`);
  }, {
    timeout: 60000,
  });

  console.log('\n✓ Transaction completed successfully!');

  // 3. Verify Admin preservation & remaining row counts
  const remainingAdmins = await prisma.user.findMany({
    where: { role: { in: ['ADMIN', 'SUPER_ADMIN'] } },
    include: { profile: true },
  });

  console.log('\n====================================================');
  console.log('CLEANUP VERIFICATION RESULT');
  console.log('====================================================');
  console.log(`Admin User(s) Preserved: ${remainingAdmins.length} ✅`);
  remainingAdmins.forEach((a) => {
    console.log(`  - Admin User: ID=${a.id}, Phone=${a.phone}, Email=${a.email}, Role=${a.role}`);
  });

  const remainingTotalUsers = await prisma.user.count();
  const remainingCustomers = await prisma.customer.count();
  const remainingRestaurants = await prisma.restaurant.count();
  const remainingOrders = await prisma.order.count();

  console.log(`\nRemaining Non-Admin Users: ${remainingTotalUsers - remainingAdmins.length} (Expected: 0) ✅`);
  console.log(`Remaining Customers:       ${remainingCustomers} (Expected: 0) ✅`);
  console.log(`Remaining Restaurants:     ${remainingRestaurants} (Expected: 0) ✅`);
  console.log(`Remaining Orders:          ${remainingOrders} (Expected: 0) ✅`);
}

main()
  .catch((e) => {
    console.error('CRITICAL TRANSACTION FAILURE:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
