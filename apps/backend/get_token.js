const { PrismaClient } = require('@prisma/client');
const { sign } = require('jsonwebtoken');
const p = new PrismaClient();

async function main() {
  const user = await p.user.findUnique({ where: { id: 'b671b6e7-b483-4692-98ba-b76e5c70a888' } });
  
  // Need the jwt secret!
  const secret = process.env.JWT_SECRET || 'ZAYKAFOOD_SUPER_SECRET_KEY_2026_PHASE1';
  
  const token = sign({
    sub: user.id,
    phone: user.phone,
    role: user.role,
  }, secret, { expiresIn: '7d' });
  
  console.log(token);
}
main().finally(() => p.$disconnect());
