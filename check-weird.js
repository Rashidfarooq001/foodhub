const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const users = await prisma.user.findMany();
  const weird = users.filter(u => !u.phone.startsWith('+91'));
  console.log('Weird users:', weird.length);
  if (weird.length > 0) console.log(weird.map(u => u.phone));
}
main().catch(console.error).finally(() => prisma.$disconnect());
