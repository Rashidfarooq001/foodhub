const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const customer = await prisma.customer.findUnique({
    where: { userId: 'b671b6e7-b483-4692-98ba-b76e5c70a888' }
  });
  console.log(customer);
}
main().catch(console.error).finally(() => prisma.$disconnect());
