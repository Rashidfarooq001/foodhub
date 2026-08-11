const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const prisma = new PrismaClient();

async function main() {
  console.log('=== STARTING ADMIN SECURITY QUESTIONS UPDATE E2E TEST ===\n');

  const adminUserId = '3f2a1b1b-c4d1-4318-8aee-dc67a99975a5';

  // 1. Fetch & Verify Admin User Existence
  const admin = await prisma.user.findUnique({ where: { id: adminUserId } });
  if (!admin) throw new Error('Target Admin user missing!');

  console.log('1. Target Admin User Check:');
  console.log(`   ID:   ${admin.id}`);
  console.log(`   Role: ${admin.role} ✅`);

  // 2. Set new security recovery questions (DOB: 1990-01-01, Favorite Person: Rahul)
  const newDob = '1990-01-01';
  const newPerson = 'rahul';

  const newDobHash = await bcrypt.hash(newDob, 10);
  const newPersonHash = await bcrypt.hash(newPerson, 10);

  await prisma.user.update({
    where: { id: adminUserId },
    data: {
      adminDobHash: newDobHash,
      adminFavoritePersonHash: newPersonHash,
    },
  });
  console.log('\n2. Updated Security Questions in DB:');
  console.log(`   New DOB:             ${newDob}`);
  console.log(`   New Favorite Person: ${newPerson} ✅`);

  // 3. Test Old Answers Fail
  console.log('\n3. Testing Old Answers (2005-01-01 / reshi)...');
  const isOldDobValid = await bcrypt.compare('2005-01-01', newDobHash);
  const isOldPersonValid = await bcrypt.compare('reshi', newPersonHash);
  console.log(`   Old DOB Valid:    ${isOldDobValid} (Expected: false) ✅`);
  console.log(`   Old Person Valid: ${isOldPersonValid} (Expected: false) ✅`);
  if (isOldDobValid || isOldPersonValid) {
    throw new Error('TEST FAILED: Old security answers still worked after update!');
  }

  // 4. Test New Answers Succeed
  console.log('\n4. Testing New Answers (1990-01-01 / Rahul)...');
  const isNewDobValid = await bcrypt.compare('1990-01-01', newDobHash);
  const isNewPersonValid = await bcrypt.compare('rahul', newPersonHash);
  console.log(`   New DOB Valid:    ${isNewDobValid} (Expected: true) ✅`);
  console.log(`   New Person Valid: ${isNewPersonValid} (Expected: true) ✅`);
  if (!isNewDobValid || !isNewPersonValid) {
    throw new Error('TEST FAILED: New security answers failed verification!');
  }

  // 5. Restore Default Security Answers (2005-01-01 / reshi)
  console.log('\n5. Restoring Default Recovery Hashes (2005-01-01 / reshi)...');
  const defaultDobHash = await bcrypt.hash('2005-01-01', 10);
  const defaultPersonHash = await bcrypt.hash('reshi', 10);

  await prisma.user.update({
    where: { id: adminUserId },
    data: {
      adminDobHash: defaultDobHash,
      adminFavoritePersonHash: defaultPersonHash,
    },
  });
  console.log('✓ Restored default security question hashes! ✅');

  console.log('\n======================================================');
  console.log('ADMIN SECURITY QUESTIONS CHANGE E2E TEST PASSED! 🎉');
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
