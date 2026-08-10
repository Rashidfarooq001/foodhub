const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const prisma = new PrismaClient();

async function main() {
  console.log('=== APPLYING ADMIN RECOVERY COLUMNS TO DATABASE ===\n');

  await prisma.$executeRawUnsafe(`
    DO $$
    BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'admin_dob_hash') THEN
            ALTER TABLE "users" ADD COLUMN "admin_dob_hash" TEXT;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'admin_favorite_person_hash') THEN
            ALTER TABLE "users" ADD COLUMN "admin_favorite_person_hash" TEXT;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'admin_recovery_token') THEN
            ALTER TABLE "users" ADD COLUMN "admin_recovery_token" TEXT;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'admin_recovery_expires_at') THEN
            ALTER TABLE "users" ADD COLUMN "admin_recovery_expires_at" TIMESTAMP(3);
        END IF;
    END $$;
  `);

  console.log('✓ Columns created successfully in PostgreSQL users table! ✅');

  // Provision initial security question hashes for existing SuperAdmin account (3f2a1b1b-c4d1-4318-8aee-dc67a99975a5)
  const dobHash = await bcrypt.hash('2005-01-01', 10);
  const personHash = await bcrypt.hash('reshi', 10);

  const updatedAdmin = await prisma.user.update({
    where: { id: '3f2a1b1b-c4d1-4318-8aee-dc67a99975a5' },
    data: {
      adminDobHash: dobHash,
      adminFavoritePersonHash: personHash,
    },
  });

  console.log(`✓ Admin User ${updatedAdmin.id} security question hashes provisioned! ✅`);
  console.log(`  DOB ('2005-01-01') Hash: ${updatedAdmin.adminDobHash.substring(0, 15)}...`);
  console.log(`  Favorite Person ('reshi') Hash: ${updatedAdmin.adminFavoritePersonHash.substring(0, 15)}...`);
}

main()
  .catch((e) => {
    console.error('DB Migration Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
