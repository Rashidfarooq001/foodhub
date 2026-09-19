const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const users = await prisma.user.findMany({
    where: { phone: { startsWith: '+0' } }
  });
  console.log('Users with +0:', users.length);
  if (users.length > 0) console.log(users.map(u => u.phone));
}
main().catch(console.error).finally(() => prisma.$disconnect());
