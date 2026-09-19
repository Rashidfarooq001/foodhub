const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const users = await prisma.user.findMany({
    where: { role: 'CUSTOMER' },
    take: 5,
    orderBy: { createdAt: 'desc' }
  });
  console.log(users.map(u => ({ phone: u.phone, hashPrefix: u.passwordHash?.substring(0, 7) })));
}
main().catch(console.error).finally(() => prisma.$disconnect());
