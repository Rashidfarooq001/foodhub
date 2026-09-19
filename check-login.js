const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  // Check all formats this phone could be stored as
  const phones = ['+919320646292', '919320646292', '9320646292', '+09320646292'];
  for (const p of phones) {
    const u = await prisma.user.findFirst({ where: { phone: p }, select: { id: true, phone: true, role: true, isActive: true, passwordHash: true } });
    if (u) {
      console.log('FOUND:', u.phone, '| role:', u.role, '| isActive:', u.isActive, '| hashStart:', u.passwordHash?.substring(0, 20));
    }
  }
  // Also do a broad search for any phone containing 9320646292
  const all = await prisma.user.findMany({ where: { phone: { contains: '9320646292' } }, select: { id: true, phone: true, role: true, isActive: true } });
  console.log('All matching:', all);
}
main().catch(console.error).finally(() => prisma.$disconnect());
