const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({
  datasourceUrl: 'postgresql://neondb_owner:npg_iK4pyqYjFOb0@ep-empty-block-ayeiv0ux.c-5.us-east-2.aws.neon.tech/neondb?sslmode=require'
});
async function run() {
  const user = await prisma.user.findUnique({
    where: { id: '14d82b2f-7640-4795-82be-bdbb65a9182d' }
  });
  console.log("User Role:", user.role);
  await prisma.$disconnect();
}
run();
