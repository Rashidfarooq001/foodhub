const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({
  datasourceUrl:
    'postgresql://neondb_owner:npg_iK4pyqYjFOb0@ep-empty-block-ayeiv0ux.c-5.us-east-2.aws.neon.tech/neondb?sslmode=require',
});
async function main() {
  const user = await prisma.user.findFirst({
    where: { OR: [{ email: 'deleted-test@example.com' }, { phone: '+919999999999' }] },
  });
  console.log(user);
}
main().finally(() => prisma.$disconnect());
