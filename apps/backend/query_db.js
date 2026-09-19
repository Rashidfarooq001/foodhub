const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.\\\('SELECT column_name FROM information_schema.columns WHERE table_name = ''delivery_jobs''')
  .then(rows => { console.log(rows); process.exit(0); })
  .catch(err => { console.error(err); process.exit(1); });
