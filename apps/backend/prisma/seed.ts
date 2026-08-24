import { PrismaClient, UserRole, CouponType, CouponStatus } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting FoodHub Database Seeding...');

  // 1. Seed Roles
  const roles = [
    { name: UserRole.SUPER_ADMIN, description: 'Platform Super Administrator' },
    { name: UserRole.ADMIN, description: 'Platform Operations Admin' },
    { name: UserRole.RESTAURANT_OWNER, description: 'Merchant Restaurant Owner' },
    { name: UserRole.RESTAURANT_MANAGER, description: 'Merchant Restaurant Store Manager' },
    { name: UserRole.RESTAURANT_STAFF, description: 'Kitchen Display Staff Operator' },
    { name: UserRole.DELIVERY_PARTNER, description: 'Gig Delivery Fleet Courier' },
    { name: UserRole.CUSTOMER, description: 'End Customer Consumer' },
    { name: UserRole.SUPPORT, description: 'Customer Support Incident Specialist' },
    { name: UserRole.FINANCE, description: 'Financial Settlement & Tax Officer' },
  ];

  for (const r of roles) {
    await prisma.role.upsert({
      where: { name: r.name },
      update: { description: r.description },
      create: r,
    });
  }
  console.log('✅ Roles seeded successfully.');

  // 2. Seed Permissions
  const permissions = [
    { action: 'users:read', description: 'View user accounts' },
    { action: 'users:write', description: 'Create and update user accounts' },
    { action: 'restaurants:manage', description: 'Approve and modify restaurant listings' },
    { action: 'orders:override', description: 'Support override for active order state' },
    { action: 'system:config', description: 'Manage platform global settings' },
  ];

  for (const p of permissions) {
    await prisma.permission.upsert({
      where: { action: p.action },
      update: { description: p.description },
      create: p,
    });
  }

  // 3. Seed Password Hash
  const passwordHash = '$2b$12$e83B1m5zP6GqLpM0sK5xOuF6R7L9N0V2Z4Y6X8W0V2Z4Y6X8W0V2Z'; // SuperAdmin123!

  // 4. Seed SuperAdmin User
  const adminPhone = '+919999999999';
  const adminEmail = 'admin@foodhub.com';
  await prisma.user.upsert({
    where: { phone: adminPhone },
    update: { email: adminEmail },
    create: {
      phone: adminPhone,
      email: adminEmail,
      passwordHash,
      role: UserRole.SUPER_ADMIN,
      isVerified: true,
      profile: {
        create: {
          firstName: 'FoodHub',
          lastName: 'Admin',
        },
      },
    },
  });

  // 5. Seed Customer User
  const customerPhone = '+919876543211';
  await prisma.user.upsert({
    where: { phone: customerPhone },
    update: { email: 'customer@foodhub.com' },
    create: {
      phone: customerPhone,
      email: 'customer@foodhub.com',
      passwordHash,
      role: UserRole.CUSTOMER,
      isVerified: true,
      profile: {
        create: {
          firstName: 'Rahul',
          lastName: 'Sharma',
        },
      },
    },
  });

  // 6. Seed System Settings
  const settings = [
    { key: 'APP_NAME', value: 'FoodHub' },
    { key: 'DEFAULT_CURRENCY', value: 'INR' },
    { key: 'TAX_PERCENT', value: '5.0' },
    { key: 'PACKAGING_FEE', value: '15.0' },
    { key: 'BASE_DELIVERY_FEE', value: '30.0' },
  ];
  for (const s of settings) {
    await prisma.systemSetting.upsert({
      where: { key: s.key },
      update: { value: s.value },
      create: s,
    });
  }

  // 7. Seed Sample Coupons
  const coupons = [
    {
      code: 'FOODHUB50',
      couponType: CouponType.PERCENTAGE,
      discountVal: 50.0,
      minOrderVal: 199.0,
      maxDiscount: 100.0,
      status: CouponStatus.ACTIVE,
      validFrom: new Date(),
      validTill: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      usageLimit: 1000,
    },
    {
      code: 'WELCOME100',
      couponType: CouponType.FLAT,
      discountVal: 100.0,
      minOrderVal: 299.0,
      maxDiscount: 100.0,
      status: CouponStatus.ACTIVE,
      validFrom: new Date(),
      validTill: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
      usageLimit: 5000,
    },
  ];
  for (const c of coupons) {
    await prisma.coupon.upsert({
      where: { code: c.code },
      update: { status: c.status },
      create: c,
    });
  }

  // 8. Seed Restaurant Owner & Restaurant
  const ownerPhone = '+919876543210';
  const restaurantOwner = await prisma.user.upsert({
    where: { phone: ownerPhone },
    update: { role: UserRole.RESTAURANT_OWNER },
    create: {
      phone: ownerPhone,
      email: 'owner@spicegarden.com',
      passwordHash,
      role: UserRole.RESTAURANT_OWNER,
      isVerified: true,
      profile: {
        create: {
          firstName: 'Rajesh',
          lastName: 'Kumar',
        },
      },
    },
  });

  const restaurant = await prisma.restaurant.upsert({
    where: { slug: 'spice-garden-restaurant' },
    update: {
      isOpen: true,
      latitude: 34.2980,
      longitude: 74.4690,
    },
    create: {
      name: 'Spice Garden Restaurant',
      slug: 'spice-garden-restaurant',
      phone: ownerPhone,
      licenseFssai: '11223344556677',
      addressLine: 'Main Chowk, Sopore, Kashmir 193201',
      latitude: 34.2980,
      longitude: 74.4690,
      ownerId: restaurantOwner.id,
      avgRating: 4.8,
      bannerUrl: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80',
    },
  });

  // 9. Seed Categories & Food Items
  const catBiryani = await prisma.category.findFirst({
    where: { restaurantId: restaurant.id, name: 'Biryani' },
  }) || await prisma.category.create({
    data: { restaurantId: restaurant.id, name: 'Biryani', displayOrder: 1 },
  });

  await prisma.foodItem.upsert({
    where: { id: 'food-item-biryani-1' },
    update: { price: 340 },
    create: {
      id: 'food-item-biryani-1',
      restaurantId: restaurant.id,
      categoryId: catBiryani.id,
      name: 'Hyderabadi Chicken Dum Biryani',
      description: 'Aromatic basmati rice cooked with marinated chicken pieces and whole spices.',
      price: 340,
      isVeg: false,
      imageUrl: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=600&q=80',
    },
  });

  // 10. Seed Delivery Driver
  const driverPhone = '+919876500999';
  await prisma.user.upsert({
    where: { phone: driverPhone },
    update: { role: UserRole.DELIVERY_PARTNER },
    create: {
      phone: driverPhone,
      email: 'driver@foodhub.com',
      passwordHash,
      role: UserRole.DELIVERY_PARTNER,
      isVerified: true,
      profile: {
        create: {
          firstName: 'Vikram',
          lastName: 'Singh',
        },
      },
    },
  });

  console.log('🎉 FoodHub Full Database Seeding Complete!');
}

main()
  .catch((e) => {
    console.error('❌ Database Seeding Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
