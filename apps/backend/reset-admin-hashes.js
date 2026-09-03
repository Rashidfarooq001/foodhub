const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
  const p1 = await bcrypt.hash('9999888877776666', 10);
  const p2 = await bcrypt.hash('88887777', 10);

  const res = await prisma.user.updateMany({
    where: { role: { in: ['SUPER_ADMIN', 'ADMIN'] } },
    data: { password1Hash: p1, password2Hash: p2 },
  });

  console.log('=== ADMIN BCRYPT HASHES ALIGNED IN POSTGRESQL ===');
  console.log(`Updated records: ${res.count}`);
}

main().finally(() => prisma.$disconnect());
