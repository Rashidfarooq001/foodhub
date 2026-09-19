const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.user.findFirst({ where: { role: 'RESTAURANT', isActive: true, restaurantId: { not: null } } })
  .then(u => console.log(JSON.stringify(u)))
  .catch(console.error).finally(()=>process.exit(0));
