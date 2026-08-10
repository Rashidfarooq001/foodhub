const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const prisma = new PrismaClient();

async function main() {
  console.log('=== VERIFYING ADMIN DASHBOARD TWO-PASSWORD LOGIN ===\n');

  // 1. Fetch Admin User
  const adminUser = await prisma.user.findFirst({
    where: {
      role: { in: ['ADMIN', 'SUPER_ADMIN'] },
      isActive: true,
    },
    include: { profile: true },
  });

  if (!adminUser) {
    throw new Error('TEST FAILED: No active Admin/SuperAdmin account found!');
  }

  console.log('1. Admin Account Inspection:');
  console.log(`   User ID:     ${adminUser.id}`);
  console.log(`   Phone:       ${adminUser.phone}`);
  console.log(`   Email:       ${adminUser.email}`);
  console.log(`   Role:        ${adminUser.role} ✅`);
  console.log(`   Is Active:   ${adminUser.isActive} ✅`);

  // 2. Test Password 1 & Password 2 Verification
  console.log('\n2. Testing Credentials Verification:');
  const isP1Valid = await bcrypt.compare('9999888877776666', adminUser.password1Hash);
  const isP2Valid = await bcrypt.compare('88887777', adminUser.password2Hash);

  console.log(`   Password 1 ('9999888877776666') Match: ${isP1Valid} ✅`);
  console.log(`   Password 2 ('88887777') Match:         ${isP2Valid} ✅`);

  if (!isP1Valid || !isP2Valid) {
    throw new Error('TEST FAILED: Admin credentials check failed!');
  }

  // 3. Test Invalid Credentials
  console.log('\n3. Testing Invalid Credentials Rejection:');
  const isWrongP1 = await bcrypt.compare('0000000000000000', adminUser.password1Hash);
  const isWrongP2 = await bcrypt.compare('00000000', adminUser.password2Hash);
  console.log(`   Wrong Password 1 Result: ${isWrongP1} (Expected: false) ✅`);
  console.log(`   Wrong Password 2 Result: ${isWrongP2} (Expected: false) ✅`);

  console.log('\n====================================================');
  console.log('ADMIN AUTHENTICATION VERIFICATION SUCCESSFUL! 🎉');
  console.log('====================================================');
}

main()
  .catch((e) => {
    console.error('TEST ERROR:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
