const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const users = await prisma.user.findMany({
    where: { role: 'CUSTOMER' },
    take: 10,
    orderBy: { createdAt: 'desc' }
  });
  console.log(users.map(u => ({ id: u.id, phone: u.phone, email: u.email })));
}
main().catch(console.error).finally(() => prisma.$disconnect());
