const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function main() {
  console.log('=== FOODHUB SYSTEM AUDIT: DATABASE & SCHEMA INSPECTION ===\n');

  const auditResults = {
    usersCount: 0,
    rolesCount: {},
    profilesCount: 0,
    orphanedProfiles: 0,
    restaurantsCount: 0,
    pendingRestaurants: 0,
    driversCount: 0,
    pendingDrivers: 0,
    ordersCount: 0,
    unassignedOrders: 0,
    couponsCount: 0,
    activeCoupons: 0,
  };

  try {
    const users = await prisma.user.findMany({ include: { profile: true } });
    auditResults.usersCount = users.length;

    users.forEach((u) => {
      auditResults.rolesCount[u.role] = (auditResults.rolesCount[u.role] || 0) + 1;
    });

    const profiles = await prisma.profile.findMany();
    auditResults.profilesCount = profiles.length;

    // Check for orphaned profiles (profile.userId not pointing to valid user)
    const userIds = new Set(users.map((u) => u.id));
    auditResults.orphanedProfiles = profiles.filter((p) => !userIds.has(p.userId)).length;

    const restaurants = await prisma.restaurant.findMany();
    auditResults.restaurantsCount = restaurants.length;
    auditResults.pendingRestaurants = restaurants.filter(
      (r) => r.status === 'PENDING_APPROVAL' || r.status === 'UNDER_REVIEW',
    ).length;

    const drivers = await prisma.driver.findMany();
    auditResults.driversCount = drivers.length;
    auditResults.pendingDrivers = drivers.filter((d) => !d.isApproved).length;

    const orders = await prisma.order.findMany();
    auditResults.ordersCount = orders.length;
    auditResults.unassignedOrders = orders.filter(
      (o) =>
        o.status === 'PREPARING' && !o.assignedFoodhubDriverId && !o.assignedRestaurantDriverId,
    ).length;

    const coupons = await prisma.coupon.findMany();
    auditResults.couponsCount = coupons.length;
    auditResults.activeCoupons = coupons.filter((c) => c.isActive).length;

    console.log('DATABASE STATS & INTEGRITY SUMMARY:');
    console.log(JSON.stringify(auditResults, null, 2));

    console.log('\nUSER RECORDS DETAILED AUDIT:');
    users.forEach((u) => {
      console.log(
        `- User ID: ${u.id} | Email: ${u.email || 'N/A'} | Phone: ${u.phone} | Role: ${u.role} | Active: ${u.isActive} | Profile: ${u.profile ? 'YES' : 'NO'}`,
      );
      if (u.profile) {
        console.log(
          `  Profile ID: ${u.profile.id} | Name: ${u.profile.firstName} ${u.profile.lastName} | Avatar: ${u.profile.avatarUrl || 'NULL'}`,
        );
      }
    });

    console.log('\nRESTAURANT RECORDS DETAILED AUDIT:');
    restaurants.forEach((r) => {
      console.log(
        `- Rest ID: ${r.id} | Name: ${r.name} | Slug: ${r.slug} | Status: ${r.status} | DeliveryMode: ${r.deliveryMode || 'N/A'}`,
      );
      console.log(
        `  Logo: ${r.logoUrl || 'NULL'} | Banner: ${r.bannerUrl || 'NULL'} | FSSAI: ${r.fssaiLicense || 'NULL'}`,
      );
    });

    console.log('\nDRIVER RECORDS DETAILED AUDIT:');
    drivers.forEach((d) => {
      console.log(
        `- Driver ID: ${d.id} | User ID: ${d.userId} | License: ${d.licenseNumber} | Approved: ${d.isApproved}`,
      );
    });
  } catch (err) {
    console.error('Database Audit Error:', err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
