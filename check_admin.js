const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.user.findMany({ where: { role: { in: ['SUPER_ADMIN', 'ADMIN'] } } })
  .then(users => { console.log(users.map(u => ({ id: u.id, role: u.role, isActive: u.isActive, phone: u.phone, email: u.email }))); process.exit(0); });
