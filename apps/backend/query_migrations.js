const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.\('SELECT * FROM _prisma_migrations')
  .then(rows => { console.log(JSON.stringify(rows, null, 2)); process.exit(0); })
  .catch(err => { console.error(err); process.exit(1); });
