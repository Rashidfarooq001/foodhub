const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

function normalizeIndianPhone(input) {
  if (!input || typeof input !== 'string') return null;
  let cleaned = input.trim().replace(/[\s\-\(\)]/g, '');

  if (cleaned.startsWith('+91')) {
    cleaned = cleaned.substring(3);
  } else if (cleaned.startsWith('+')) {
    cleaned = cleaned.substring(1);
  }

  if (cleaned.startsWith('91') && cleaned.length === 12) {
    cleaned = cleaned.substring(2);
  } else if (cleaned.startsWith('0') && cleaned.length === 11) {
    cleaned = cleaned.substring(1);
  }

  const indianMobileRegex = /^[6-9]\d{9}$/;
  if (!indianMobileRegex.test(cleaned)) {
    return null;
  }
  return cleaned;
}

async function main() {
  const users = await prisma.user.findMany({
    select: { id: true, phone: true, role: true, isActive: true },
  });

  console.log(`Processing ${users.length} users in database...`);
  let updatedCount = 0;
  let invalidCount = 0;

  for (const user of users) {
    const canonical = normalizeIndianPhone(user.phone);
    if (!canonical) {
      console.log(
        `[INVALID PHONE] ID: ${user.id} | Raw Phone: "${user.phone}" | Role: ${user.role}`,
      );
      invalidCount++;
      continue;
    }

    if (canonical !== user.phone) {
      console.log(
        `[UPDATING] ID: ${user.id} | Old: "${user.phone}" -> New: "${canonical}" | Role: ${user.role}`,
      );
      try {
        await prisma.user.update({
          where: { id: user.id },
          data: { phone: canonical },
        });
        updatedCount++;
      } catch (err) {
        console.error(`Failed to update user ${user.id}:`, err.message);
      }
    }
  }

  console.log(
    `\nMigration completed: ${updatedCount} user phone numbers converted to 10-digit canonical format. (${invalidCount} non-standard invalid records identified).`,
  );
}

main()
  .catch((e) => console.error(e))
  .finally(async () => await prisma.$disconnect());
