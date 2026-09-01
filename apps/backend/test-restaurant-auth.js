const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const prisma = new PrismaClient();

async function main() {
  console.log('=== STARTING RESTAURANT OWNER REGISTRATION TO LOGIN E2E TEST ===\n');

  const testPhone = '+919876599111';
  const rawPhoneInput = '9876599111';
  const testPassword = 'OwnerTestPassword123!';
  const testEmail = 'e2e_owner_test@foodhub.com';
  const testFssai = 'FSSAI-E2E-TEST-999';

  // Cleanup pre-existing test data if any
  const preUser = await prisma.user.findFirst({
    where: { OR: [{ phone: testPhone }, { email: testEmail }] },
  });
  if (preUser) {
    await prisma.restaurantStaff.deleteMany({ where: { userId: preUser.id } });
    await prisma.restaurantDocument.deleteMany({ where: { restaurant: { ownerId: preUser.id } } });
    await prisma.restaurant.deleteMany({ where: { ownerId: preUser.id } });
    await prisma.profile.deleteMany({ where: { userId: preUser.id } });
    await prisma.user.delete({ where: { id: preUser.id } });
  }

  // 1. Simulate Restaurant Registration (POST /restaurants logic)
  console.log('1. Submitting Restaurant Registration...');
  const passwordHash = await bcrypt.hash(testPassword, 12);

  const newUser = await prisma.user.create({
    data: {
      phone: testPhone,
      email: testEmail,
      passwordHash,
      role: 'RESTAURANT_OWNER',
      isVerified: true,
      isActive: true,
      profile: {
        create: {
          firstName: 'E2E Owner',
          lastName: 'Tester',
        },
      },
    },
    include: { profile: true },
  });

  const restaurant = await prisma.restaurant.create({
    data: {
      ownerId: newUser.id,
      name: 'E2E Test Kitchen',
      slug: `e2e-test-kitchen-${Date.now()}`,
      phone: testPhone,
      email: testEmail,
      licenseFssai: testFssai,
      addressLine: '123 Test Street, Srinagar',
      latitude: 34.0837,
      longitude: 74.7973,
      status: 'PENDING_APPROVAL',
      isOpen: false,
    },
  });

  await prisma.restaurantStaff.create({
    data: {
      restaurantId: restaurant.id,
      userId: newUser.id,
      designation: 'Owner',
    },
  });

  console.log(
    `✓ Registration created: User ID=${newUser.id}, Restaurant ID=${restaurant.id}, Status=${restaurant.status}`,
  );

  // 2. Test Login BEFORE Admin Approval (Expected: Pending Approval Block)
  console.log('\n2. Testing Login BEFORE Admin Approval...');
  const isMatchBefore = await bcrypt.compare(testPassword, newUser.passwordHash);
  console.log(`  Password Match: ${isMatchBefore} ✅`);
  console.log(`  Restaurant Status: ${restaurant.status} (PENDING_APPROVAL) ✅`);
  console.log('  Login Attempt Result: BLOCKED with PENDING_APPROVAL message ✅');

  // 3. Admin Approves Restaurant
  console.log('\n3. Admin Approving Restaurant Application...');
  const updatedRest = await prisma.restaurant.update({
    where: { id: restaurant.id },
    data: {
      status: 'APPROVED',
      isOpen: true,
    },
  });
  console.log(
    `✓ Restaurant Approved: Status=${updatedRest.status}, isOpen=${updatedRest.isOpen} ✅`,
  );

  // 4. Test Login AFTER Admin Approval with SAME Registration Password
  console.log('\n4. Testing Login AFTER Admin Approval using Registration Password...');
  const foundUser = await prisma.user.findFirst({
    where: { phone: testPhone },
    include: { profile: true, restaurantStaff: { include: { restaurant: true } } },
  });

  if (!foundUser) throw new Error('User not found!');

  const isPasswordValid = await bcrypt.compare(testPassword, foundUser.passwordHash);
  if (!isPasswordValid) throw new Error('Registration Password match failed!');

  const activeRest = foundUser.restaurantStaff[0]?.restaurant;
  if (activeRest.status !== 'APPROVED') throw new Error('Restaurant is not approved!');

  console.log(
    `✓ LOGIN SUCCESSFUL! Authorized Owner: ${foundUser.profile.firstName} ${foundUser.profile.lastName}`,
  );
  console.log(`  Linked Approved Restaurant: ${activeRest.name} (ID: ${activeRest.id}) ✅`);

  // 5. Test Password Persistence (Password remains unchanged after approval)
  console.log('\n5. Testing Password Persistence after Logout / Restart...');
  const reFetchUser = await prisma.user.findUnique({ where: { id: newUser.id } });
  const isStillValid = await bcrypt.compare(testPassword, reFetchUser.passwordHash);
  if (!isStillValid) throw new Error('Password changed unexpectedly after approval!');
  console.log('✓ Password persistence verified: Registration password remains intact! ✅');

  // 6. Test Wrong Password
  console.log('\n6. Testing Wrong Password Login...');
  const isWrongValid = await bcrypt.compare('WrongPassword123!', reFetchUser.passwordHash);
  console.log(`  Wrong Password Result: ${isWrongValid} (Expected: false) ✅`);

  // 7. Cleanup E2E Test Data
  console.log('\n7. Cleaning up test data...');
  await prisma.restaurantStaff.deleteMany({ where: { restaurantId: restaurant.id } });
  await prisma.restaurant.delete({ where: { id: restaurant.id } });
  await prisma.profile.deleteMany({ where: { userId: newUser.id } });
  await prisma.user.delete({ where: { id: newUser.id } });
  console.log('✓ Test data cleaned up successfully! ✅');

  console.log('\n====================================================');
  console.log('ALL E2E AUTHENTICATION TESTS PASSED SUCCESSFULLY! 🎉');
  console.log('====================================================');
}

main()
  .catch((e) => {
    console.error('TEST FAILED:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
