const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
async function main() {
  const admin = await p.user.findFirst({ where: { role: 'SUPER_ADMIN' }, select: { phone: true } });
  console.log('Admin phone:', admin?.phone);
}
main().catch(console.error).finally(() => p.$disconnect());
