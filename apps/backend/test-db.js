const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const users = await prisma.user.findMany({
    where: { role: 'CUSTOMER' },
    take: 5,
    include: { profile: true }
  });
  console.log(users.map(u => ({ id: u.id, phone: u.phone, email: u.email, name: u.profile?.firstName })));
}
main().catch(console.error).finally(() => prisma.$disconnect());
