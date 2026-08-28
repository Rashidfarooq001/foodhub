const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const taxRule = await prisma.taxRule.findUnique({ where: { code: 'RESTAURANT_FOOD_SERVICE' } });
  console.log("DB TaxRule:", taxRule);
}
check();
