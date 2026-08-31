const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({
  datasources: {
    db: { url: 'postgresql://neondb_owner:npg_iK4pyqYjFOb0@ep-empty-block-ayeiv0ux.c-5.us-east-2.aws.neon.tech/neondb?sslmode=require' }
  }
});
prisma.$queryRaw`SELECT column_name FROM information_schema.columns WHERE table_name='settlements'`.then(console.log).finally(() => prisma.$disconnect());
