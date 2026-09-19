const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.\('SHOW COLUMNS FROM delivery_jobs').then(console.log).finally(()=>process.exit(0));
