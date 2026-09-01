const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({
  datasourceUrl:
    'postgresql://neondb_owner:npg_iK4pyqYjFOb0@ep-empty-block-ayeiv0ux.c-5.us-east-2.aws.neon.tech/neondb?sslmode=require',
});
async function main() {
  const user = await prisma.user.create({
    data: { phone: '9999999999', email: 'testdel@example.com', passwordHash: '123' },
  });
  console.log('Created:', user.id);
  await prisma.user.delete({ where: { id: user.id } });
  const found = await prisma.user.findFirst({ where: { phone: '9999999999' } });
  console.log('Found after delete:', found);
}
main().finally(() => prisma.$disconnect());
