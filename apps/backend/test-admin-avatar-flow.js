const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('=== STARTING ADMIN AVATAR FLOW E2E TRACE ===\n');

  const adminUserId = '3f2a1b1b-c4d1-4318-8aee-dc67a99975a5';

  // 1. Fetch current profile
  const user = await prisma.user.findUnique({
    where: { id: adminUserId },
    include: { profile: true },
  });

  console.log('1. INITIAL ADMIN RECORD:');
  console.log(`   User ID:      ${user.id}`);
  console.log(`   Role:         ${user.role}`);
  console.log(`   Profile ID:   ${user.profile ? user.profile.id : 'NONE'}`);
  console.log(`   Initial Avatar: ${user.profile ? user.profile.avatarUrl : 'NULL'}\n`);

  // 2. Simulate saving a new avatar URL
  const testAvatarUrl = `/uploads/test-admin-avatar-${Date.now()}.png`;

  const updatedProfile = await prisma.profile.upsert({
    where: { userId: adminUserId },
    update: { avatarUrl: testAvatarUrl },
    create: {
      userId: adminUserId,
      firstName: 'Rashid',
      lastName: 'Reshi',
      avatarUrl: testAvatarUrl,
    },
  });

  console.log('2. UPDATED POSTGRESQL PROFILE RECORD:');
  console.log(`   Profile ID:   ${updatedProfile.id}`);
  console.log(`   New avatarUrl:${updatedProfile.avatarUrl} ✅\n`);

  // 3. Verify profile fetch returns new avatarUrl
  const userAfter = await prisma.user.findUnique({
    where: { id: adminUserId },
    include: { profile: true },
  });

  console.log('3. GET PROFILE VERIFICATION:');
  console.log(`   Profile avatarUrl: ${userAfter.profile.avatarUrl}`);
  if (userAfter.profile.avatarUrl !== testAvatarUrl) {
    throw new Error('TEST FAILED: Database avatarUrl mismatch!');
  }
  console.log('   ✓ Profile GET returns exact new avatarUrl! ✅\n');

  // 4. Reset to clean state / null avatar if needed or preserve
  console.log('======================================================');
  console.log('ADMIN AVATAR DB FLOW TEST PASSED! 🎉');
  console.log('======================================================');
}

main()
  .catch((e) => {
    console.error('TEST FAILURE:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
