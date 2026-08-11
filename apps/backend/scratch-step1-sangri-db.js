const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function inspectSangri() {
  console.log('=== STEP 1: QUERYING POSTGRESQL DIRECTLY FOR RESTAURANT "sangri" ===\n');

  const sangri = await prisma.restaurant.findFirst({
    where: {
      name: { contains: 'sangri', mode: 'insensitive' },
    },
  });

  if (!sangri) {
    console.log('NO RESTAURANT NAMED "sangri" FOUND IN POSTGRESQL.');
    return;
  }

  console.log('--- POSTGRESQL RECORD ---');
  console.log(`Restaurant ID:   ${sangri.id}`);
  console.log(`Restaurant name: ${sangri.name}`);
  console.log(`latitude:        ${sangri.latitude}`);
  console.log(`longitude:       ${sangri.longitude}`);
  console.log(`addressLine:     "${sangri.addressLine}"`);
  console.log(`status:          ${sangri.status}`);
  console.log(`createdAt:       ${sangri.createdAt}`);
  console.log(`updatedAt:       ${sangri.updatedAt}`);
}

inspectSangri()
  .catch(console.error)
  .finally(async () => await prisma.$disconnect());
