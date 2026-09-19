const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const prisma = new PrismaClient();
async function main() {
  const u = await prisma.user.findFirst({ where: { phone: '+919320646292' }, select: { passwordHash: true } });
  if (!u) { console.log('USER NOT FOUND'); return; }
  // Test common passwords WITHOUT printing them
  const candidates = ['zayka@123', 'Zayka@123', 'zayka123', 'Zayka123', 'zaykaFood@123', '123456', 'password'];
  for (const c of candidates) {
    const match = await bcrypt.compare(c, u.passwordHash);
    if (match) {
      console.log('MATCH FOUND - length:', c.length, '- starts with:', c[0]);
    }
  }
  console.log('Hash prefix (safe):', u.passwordHash.substring(0, 15));
  console.log('Hash cost round:', u.passwordHash.split('$')[2]);
  console.log('Done checking');
}
main().catch(console.error).finally(() => prisma.$disconnect());
