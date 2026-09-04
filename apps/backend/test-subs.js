const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const subs = await prisma.pushSubscription.findMany();
  console.log('Total subscriptions:', subs.length);
  const users = await prisma.user.findMany({
    where: { id: { in: subs.map(s => s.userId) } },
    select: { id: true, role: true }
  });
  console.log('Roles with subs:', users.map(u => u.role));
}
main().catch(console.error).finally(() => prisma.$disconnect());
