const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const jwt = require('jsonwebtoken');
require('dotenv').config();
async function run() {
  const staff = await prisma.restaurantStaff.findFirst({ where: { restaurantId: 'efcc61f1-7314-47a3-888e-aa14c1894c10' }, include: { user: true } });
  const u = staff.user;
  const token = jwt.sign(
    { sub: u.id, phone: u.phone, role: u.role, restaurantId: staff.restaurantId },
    process.env.JWT_SECRET || 'zayka-super-secret-key-2026',
    { expiresIn: '1d' }
  );
  const r = await fetch('https://api.zaykafood.online/api/v1/orders', {
    headers: { Authorization: 'Bearer ' + token }
  });
  console.log('STATUS:', r.status);
  const text = await r.text();
  console.log('BODY:', text.slice(0, 500));
}
run().catch(console.error).finally(() => process.exit(0));
