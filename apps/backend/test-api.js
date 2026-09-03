const { PrismaClient } = require('@prisma/client');
const jwt = require('jsonwebtoken');
const prisma = new PrismaClient();

async function run() {
  const driver = await prisma.driver.findFirst({
    where: {
      user: {
        profile: {
          firstName: { contains: 'Muneeb', mode: 'insensitive' }
        }
      }
    },
    include: {
      user: true
    }
  });

  if (!driver) {
    console.log('Driver not found');
    return;
  }

  const payload = {
    id: driver.user.id,
    sub: driver.user.id,
    role: driver.user.role,
    phone: driver.user.phone
  };

  const token = jwt.sign(payload, process.env.JWT_SECRET || 'ZAYKAFOOD_SUPER_SECRET_KEY_2026', { expiresIn: '1d' });
  
  console.log('Fetching active jobs...');
  
  const res = await fetch(`http://localhost:3001/api/v1/delivery/active-jobs`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  console.log(`HTTP Status: ${res.status}`);
  const text = await res.text();
  console.log(`Response: ${text.substring(0, 500)}`);
}

run().catch(console.error).finally(() => prisma.$disconnect());
