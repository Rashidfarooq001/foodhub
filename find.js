const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const formatsToMatch = ['+919320646292', '919320646292', '9320646292'];
  const user = await prisma.user.findFirst({
      where: {
        OR: formatsToMatch.map((p) => ({ phone: p })),
      }
  });
  console.log(user);
}
main().catch(console.error).finally(() => prisma.$disconnect());
