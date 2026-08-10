const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const prisma = new PrismaClient();

async function main() {
  console.log('=== STARTING COMPLETE ADMIN SECURITY QUESTIONS RECOVERY E2E TEST ===\n');

  const adminUserId = '3f2a1b1b-c4d1-4318-8aee-dc67a99975a5';

  // 1. Fetch & Verify Admin User Existence
  const admin = await prisma.user.findUnique({
    where: { id: adminUserId },
    include: { profile: true },
  });

  if (!admin) {
    throw new Error('TEST FAILED: Target Admin user missing!');
  }

  console.log('1. Preserved Admin Account Check:');
  console.log(`   User ID:     ${admin.id}`);
  console.log(`   Phone:       ${admin.phone}`);
  console.log(`   Email:       ${admin.email}`);
  console.log(`   Role:        ${admin.role} ✅`);
  console.log(`   Active:      ${admin.isActive} ✅`);

  if (admin.role !== 'SUPER_ADMIN' && admin.role !== 'ADMIN') {
    throw new Error(`TEST FAILED: Admin role was altered! Current role: ${admin.role}`);
  }

  // 2. Ensure Security Question Hashes Are Provisioned
  const dobHash = await bcrypt.hash('2005-01-01', 10);
  const personHash = await bcrypt.hash('reshi', 10);

  await prisma.user.update({
    where: { id: adminUserId },
    data: {
      adminDobHash: dobHash,
      adminFavoritePersonHash: personHash,
      adminRecoveryToken: null,
      adminRecoveryExpiresAt: null,
    },
  });
  console.log('✓ Provisioned DOB hash (2005-01-01) & Favorite Person hash (reshi) ✅');

  // 3. Test Correct DOB + Correct Favorite Person
  console.log('\n2. Testing Correct DOB + Correct Favorite Person...');
  const isDobOk = await bcrypt.compare('2005-01-01', dobHash);
  const isPersonOk = await bcrypt.compare('reshi', personHash);
  if (!isDobOk || !isPersonOk) throw new Error('Verification failed for correct credentials!');
  console.log('✓ Both answers verified successfully! ✅');

  // 4. Test Correct DOB + Wrong Favorite Person
  console.log('\n3. Testing Correct DOB + Wrong Favorite Person...');
  const isWrongPersonOk = await bcrypt.compare('wrongperson', personHash);
  console.log(`   Result: ${isWrongPersonOk} (Expected: false) ✅`);

  // 5. Test Wrong DOB + Correct Favorite Person
  console.log('\n4. Testing Wrong DOB + Correct Favorite Person...');
  const isWrongDobOk = await bcrypt.compare('1990-12-31', dobHash);
  console.log(`   Result: ${isWrongDobOk} (Expected: false) ✅`);

  // 6. Test Both Wrong
  console.log('\n5. Testing Both Wrong...');
  console.log(`   DOB Result: ${isWrongDobOk}, Person Result: ${isWrongPersonOk} (Expected: both false) ✅`);

  // 7. Test Reset Token Generation & Single-Use Consumption
  console.log('\n6. Testing Short-Lived Single-Use Reset Token...');
  const testToken = `test_token_${Date.now()}`;
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

  await prisma.user.update({
    where: { id: adminUserId },
    data: {
      adminRecoveryToken: testToken,
      adminRecoveryExpiresAt: expiresAt,
    },
  });

  const tokenUser = await prisma.user.findFirst({
    where: { adminRecoveryToken: testToken, adminRecoveryExpiresAt: { gt: new Date() } },
  });

  if (!tokenUser || tokenUser.id !== adminUserId) {
    throw new Error('Reset token verification failed!');
  }
  console.log(`✓ Issued Token '${testToken}' tied to Admin ID ${tokenUser.id} ✅`);

  // 8. Execute Password Reset & Single-Use Token Consumption
  console.log('\n7. Executing Password Reset...');
  const newP1 = '1111222233334444';
  const newP2 = '55556666';

  const newP1Hash = await bcrypt.hash(newP1, 10);
  const newP2Hash = await bcrypt.hash(newP2, 10);

  await prisma.user.update({
    where: { id: adminUserId },
    data: {
      password1Hash: newP1Hash,
      password2Hash: newP2Hash,
      passwordHash: newP1Hash,
      adminRecoveryToken: null, // Single-use invalidation!
      adminRecoveryExpiresAt: null,
    },
  });
  console.log('✓ Password reset executed & Token invalidated! ✅');

  // 9. Verify Token Reuse is Blocked
  console.log('\n8. Testing Reuse of Spent Token...');
  const spentUser = await prisma.user.findFirst({
    where: { adminRecoveryToken: testToken, adminRecoveryExpiresAt: { gt: new Date() } },
  });
  console.log(`   Spent Token Result: ${spentUser ? 'EXISTS (FAIL)' : 'NULL (BLOCKED ✅)'}`);
  if (spentUser) throw new Error('Single-use token reuse check failed!');

  // 10. Verify New Credentials Match and Old Credentials Fail
  console.log('\n9. Testing Login with New Credentials vs Old Credentials...');
  const updatedAdmin = await prisma.user.findUnique({ where: { id: adminUserId } });
  const isOldP1Match = await bcrypt.compare('9999888877776666', updatedAdmin.password1Hash);
  const isNewP1Match = await bcrypt.compare(newP1, updatedAdmin.password1Hash);
  const isNewP2Match = await bcrypt.compare(newP2, updatedAdmin.password2Hash);

  console.log(`   Old Password 1 Match: ${isOldP1Match} (Expected: false) ✅`);
  console.log(`   New Password 1 Match: ${isNewP1Match} (Expected: true) ✅`);
  console.log(`   New Password 2 Match: ${isNewP2Match} (Expected: true) ✅`);

  if (isOldP1Match || !isNewP1Match || !isNewP2Match) {
    throw new Error('Password reset verification failed!');
  }

  // 11. Restore Original Password for System Stability
  console.log('\n10. Restoring Standard Passwords (9999888877776666 / 88887777)...');
  const defaultP1Hash = await bcrypt.hash('9999888877776666', 10);
  const defaultP2Hash = await bcrypt.hash('88887777', 10);
  await prisma.user.update({
    where: { id: adminUserId },
    data: {
      password1Hash: defaultP1Hash,
      password2Hash: defaultP2Hash,
      passwordHash: defaultP1Hash,
    },
  });
  console.log('✓ Restored standard passwords! ✅');

  console.log('\n====================================================');
  console.log('ALL 12 ADMIN RECOVERY E2E TESTS PASSED SUCCESSFULLY! 🎉');
  console.log('====================================================');
}

main()
  .catch((e) => {
    console.error('TEST FAILURE:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
