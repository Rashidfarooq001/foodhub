const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function runDeepAudit() {
  console.log('=== DEEP MONOREPO DATA & TRACE AUDIT ===\n');

  // --- 1. SEARCH DATABASE FOR BENGALURU ADDRESSES ---
  console.log('--- 1. SEARCHING POSTGRESQL DATABASE FOR BENGALURU ADDRESSES ---');
  const bengaluruDbAddresses = await prisma.customerAddress.findMany({
    where: {
      OR: [
        { addressLine1: { contains: 'Green Valley', mode: 'insensitive' } },
        { addressLine1: { contains: 'Flat 402', mode: 'insensitive' } },
        { addressLine2: { contains: 'Indiranagar', mode: 'insensitive' } },
        { addressLine1: { contains: 'Tech Park', mode: 'insensitive' } },
        { city: { contains: 'Bengaluru', mode: 'insensitive' } },
      ],
    },
    include: { customer: { include: { user: { include: { profile: true } } } } },
  });

  console.log(`DB Query returned ${bengaluruDbAddresses.length} Bengaluru addresses.`);

  // --- 2. SEARCH DATABASE FOR CURRENT LOCATION ADDRESSES ---
  console.log('\n--- 2. SEARCHING POSTGRESQL DATABASE FOR CURRENT LOCATION ADDRESSES ---');
  const currentLocationDbAddresses = await prisma.customerAddress.findMany({
    where: {
      addressLabel: { equals: 'Current Location', mode: 'insensitive' },
    },
  });
  console.log(`DB Query returned ${currentLocationDbAddresses.length} "Current Location" records:`);
  currentLocationDbAddresses.forEach((addr, i) => {
    console.log(`  [${i + 1}] ID: ${addr.id} | Customer ID: ${addr.customerId} | Label: "${addr.addressLabel}" | Line1: "${addr.addressLine1}" | Lat: ${addr.latitude}, Lng: ${addr.longitude}`);
  });

  // --- 3. ALL CUSTOMER ADDRESSES IN DB ---
  console.log('\n--- 3. LISTING ALL CUSTOMER ADDRESSES IN POSTGRESQL ---');
  const allAddresses = await prisma.customerAddress.findMany({
    take: 20,
    include: { customer: { include: { user: true } } },
  });
  console.log(`Total addresses in DB: ${allAddresses.length}`);
  allAddresses.forEach((addr, i) => {
    console.log(`  [${i + 1}] ID: ${addr.id} | CustID: ${addr.customerId} | User Phone: ${addr.customer?.user?.phone || 'N/A'} | Label: "${addr.addressLabel}" | City: "${addr.city}" | Lat: ${addr.latitude}, Lng: ${addr.longitude}`);
  });

  // --- 4. AUDIT ALL RESTAURANTS FOR REAL COORDINATES & VALUES ---
  console.log('\n--- 4. AUDITING ALL RESTAURANTS IN POSTGRESQL FOR COORDINATES & VALUES ---');
  const restaurants = await prisma.restaurant.findMany({
    take: 10,
    select: {
      id: true,
      name: true,
      addressLine: true,
      city: true,
      latitude: true,
      longitude: true,
      deliveryRadius: true,
      priceForTwo: true,
      status: true,
    },
  });
  console.log(`Found ${restaurants.length} restaurants in DB:`);
  restaurants.forEach((r, i) => {
    console.log(`  [${i + 1}] ID: ${r.id} | Name: "${r.name}" | Status: ${r.status} | Lat: ${r.latitude}, Lng: ${r.longitude} | Radius: ${r.deliveryRadius}km | PriceForTwo: ${r.priceForTwo || 'N/A'}`);
  });

  console.log('\n====================================================');
  console.log('DATABASE AUDIT COMPLETE');
  console.log('====================================================');
}

runDeepAudit()
  .catch(console.error)
  .finally(async () => await prisma.$disconnect());
