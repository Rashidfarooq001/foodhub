const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const prisma = new PrismaClient();

async function main() {
  console.log('=== INSPECTING PRESERVED ADMIN ACCOUNT IN DATABASE ===\n');

  const adminUsers = await prisma.user.findMany({
    where: {
      role: { in: ['ADMIN', 'SUPER_ADMIN'] },
    },
    include: {
      profile: true,
    },
  });

  console.log(`Found ${adminUsers.length} Admin User(s):`);
  for (const admin of adminUsers) {
    console.log(`\n----------------------------------------`);
    console.log(`Admin User ID:    ${admin.id}`);
    console.log(`Phone:            ${admin.phone}`);
    console.log(`Email:            ${admin.email || 'N/A'}`);
    console.log(`Role:             ${admin.role}`);
    console.log(`Is Active:        ${admin.isActive}`);
    console.log(`Is Verified:      ${admin.isVerified}`);
    console.log(`Has passwordHash: ${!!admin.passwordHash} (${admin.passwordHash ? admin.passwordHash.substring(0, 15) + '...' : 'NULL'})`);
    console.log(`Has password1Hash: ${!!admin.password1Hash} (${admin.password1Hash ? admin.password1Hash.substring(0, 15) + '...' : 'NULL'})`);
    console.log(`Has password2Hash: ${!!admin.password2Hash} (${admin.password2Hash ? admin.password2Hash.substring(0, 15) + '...' : 'NULL'})`);

    // Test default two-passwords against hashes if present
    if (admin.password1Hash) {
      const testP1 = await bcrypt.compare('9999888877776666', admin.password1Hash);
      console.log(`Password 1 ('9999888877776666') Match: ${testP1}`);
    }
    if (admin.password2Hash) {
      const testP2 = await bcrypt.compare('88887777', admin.password2Hash);
      console.log(`Password 2 ('88887777') Match: ${testP2}`);
    }
    if (admin.passwordHash) {
      const testSingleP1 = await bcrypt.compare('9999888877776666', admin.passwordHash);
      console.log(`Single PasswordHash vs '9999888877776666': ${testSingleP1}`);
    }
  }
}

main()
  .catch((e) => {
    console.error('Inspection Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
