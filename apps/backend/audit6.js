const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function run() {
  const columns = await prisma.$queryRaw`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'delivery_jobs'
    `;
  console.log(columns.map(c => c.column_name));
}
run();
