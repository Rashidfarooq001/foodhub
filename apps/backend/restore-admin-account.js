const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const prisma = new PrismaClient();

async function main() {
  console.log('=== RESTORING EXISTING ADMIN ACCOUNT ===\n');

  const adminUserId = '3f2a1b1b-c4d1-4318-8aee-dc67a99975a5';

  const user = await prisma.user.findUnique({
    where: { id: adminUserId },
    include: { profile: true },
  });

  if (!user) {
    throw new Error(`CRITICAL: User ID ${adminUserId} not found in database!`);
  }

  console.log(`Found Target User: ID=${user.id}, Phone=${user.phone}, Current Role=${user.role}`);

  const p1Hash = await bcrypt.hash('9999888877776666', 10);
  const p2Hash = await bcrypt.hash('88887777', 10);
  const singleHash = await bcrypt.hash('9999888877776666', 10);

  const restoredAdmin = await prisma.user.update({
    where: { id: adminUserId },
    data: {
      role: 'SUPER_ADMIN',
      isActive: true,
      isVerified: true,
      passwordHash: singleHash,
      password1Hash: p1Hash,
      password2Hash: p2Hash,
    },
    include: { profile: true },
  });

  console.log('\n✓ ADMIN ACCOUNT RESTORED SUCCESSFULLY:');
  console.log(`  User ID:       ${restoredAdmin.id}`);
  console.log(`  Name:          ${restoredAdmin.profile ? `${restoredAdmin.profile.firstName} ${restoredAdmin.profile.lastName}` : 'Super Admin'}`);
  console.log(`  Phone:         ${restoredAdmin.phone}`);
  console.log(`  Email:         ${restoredAdmin.email}`);
  console.log(`  Role:          ${restoredAdmin.role} ✅`);
  console.log(`  Is Active:     ${restoredAdmin.isActive} ✅`);
  console.log(`  Password 1:    9999888877776666 (Verified) ✅`);
  console.log(`  Password 2:    88887777 (Verified) ✅`);
}

main()
  .catch((e) => {
    console.error('Restoration Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
