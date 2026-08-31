const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({ datasourceUrl: 'postgresql://neondb_owner:npg_iK4pyqYjFOb0@ep-empty-block-ayeiv0ux.c-5.us-east-2.aws.neon.tech/neondb?sslmode=require' });
async function main() {
  const res = await prisma.$queryRaw\SELECT tgname FROM pg_trigger WHERE tgrelid = 'users'::regclass\;
  console.log(res);
}
main().finally(() => prisma.$disconnect());
