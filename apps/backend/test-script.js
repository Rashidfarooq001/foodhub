const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const users = await prisma.$queryRaw`SELECT id, phone, email, deleted_at FROM users WHERE email = 'deleted-test@example.com' OR phone = '+919999999999'`;
  console.log('PG Users:', users);
}
main().finally(() => prisma.$disconnect());
