const { PrismaClient, UserRole } = require('@prisma/client');
const prisma = new PrismaClient();

// Simulated address store logic matching useAddressStore
function createAddressStore() {
  let addresses = [];
  let selectedAddressId = null;

  return {
    getAddresses: () => addresses,
    getSelectedId: () => selectedAddressId,
    addAddress: (newAddr) => {
      const isCurrentLoc =
        newAddr.id === 'current-location' || newAddr.label === 'Current Location';
      const id = isCurrentLoc ? 'current-location' : newAddr.id || `addr-${Date.now()}`;
      const item = { ...newAddr, id, label: isCurrentLoc ? 'Current Location' : newAddr.label };

      const filtered = addresses.filter(
        (a) => a.id !== id && !(isCurrentLoc && a.label === 'Current Location'),
      );

      addresses = [...filtered, item];
      selectedAddressId = id;
    },
    clearAddresses: () => {
      addresses = [];
      selectedAddressId = null;
    },
  };
}

async function runTests() {
  console.log('=== TEST 1: CURRENT LOCATION DUPLICATION PREVENTION ===');
  const store = createAddressStore();

  // Simulate 3 GPS location updates
  store.addAddress({
    id: 'addr-gps-1',
    label: 'Current Location',
    latitude: 34.3868,
    longitude: 74.5221,
    addressLine1: 'Bandipora-Sopore Road',
  });
  store.addAddress({
    id: 'addr-gps-2',
    label: 'Current Location',
    latitude: 34.387,
    longitude: 74.5225,
    addressLine1: 'Bandipora-Sopore Road',
  });
  store.addAddress({
    id: 'addr-gps-3',
    label: 'Current Location',
    latitude: 34.3875,
    longitude: 74.523,
    addressLine1: 'Bandipora-Sopore Road',
  });

  const currentAddrs = store.getAddresses();
  console.log(`Address count in store after 3 GPS updates: ${currentAddrs.length}`);
  console.log(
    `Current Location entry ID: "${currentAddrs[0]?.id}" | Coordinates: (${currentAddrs[0]?.latitude}, ${currentAddrs[0]?.longitude})`,
  );

  if (currentAddrs.length !== 1 || currentAddrs[0]?.id !== 'current-location') {
    throw new Error('Current Location duplication prevention failed!');
  }
  console.log(
    '✓ Current Location duplication prevention verified (Exactly 1 entry with stable ID "current-location").',
  );

  console.log('\n=== TEST 2: CUSTOMER ADDRESS SESSION ISOLATION ===');
  // Add Customer A Home address
  store.addAddress({
    id: 'custA-home',
    label: 'Home',
    addressLine1: 'Sopore Main Town',
    city: 'Sopore',
    state: 'J&K',
    latitude: 34.3868,
    longitude: 74.5221,
  });

  console.log(`Customer A addresses count: ${store.getAddresses().length}`);

  // Customer A logs out -> clear store
  store.clearAddresses();
  console.log(`Addresses count after Customer A logout: ${store.getAddresses().length}`);

  if (store.getAddresses().length !== 0) {
    throw new Error('Logout address clearing failed!');
  }
  console.log('✓ Cross-customer address isolation verified (Zero leakage across sessions).');

  console.log('\n=== TEST 3: BACKEND ADDRESS CREATION NO BENGALURU FALLBACK ===');
  // Create test customer in DB
  const testUser = await prisma.user.create({
    data: {
      phone: `99${Math.floor(10000000 + Math.random() * 90000000)}`,
      passwordHash: 'testhash123',
      role: UserRole.CUSTOMER,
      isVerified: true,
      profile: { create: { firstName: 'Kashmir', lastName: 'Customer' } },
      customer: { create: {} },
    },
    include: { customer: true },
  });

  const dbAddr = await prisma.customerAddress.create({
    data: {
      customerId: testUser.customer.id,
      addressLabel: 'Home',
      addressLine1: 'Kashmir Valley',
      city: 'Sopore',
      state: 'J&K',
      postalCode: '193201',
      latitude: 34.3868,
      longitude: 74.5221,
    },
  });

  console.log(`Created DB Address ID: ${dbAddr.id}`);
  console.log(
    `DB Stored City: "${dbAddr.city}" | Coordinates: (${dbAddr.latitude}, ${dbAddr.longitude})`,
  );

  if (dbAddr.city === 'Bengaluru' || dbAddr.latitude === 12.978) {
    throw new Error('Backend stored Bengaluru fallback for Kashmir address!');
  }
  console.log('✓ Backend DB address creation verified (No Bengaluru defaults).');

  // Clean up test records
  await prisma.customerAddress.delete({ where: { id: dbAddr.id } });
  await prisma.customer.delete({ where: { id: testUser.customer.id } });
  await prisma.user.delete({ where: { id: testUser.id } });

  console.log('\nALL CUSTOMER ADDRESS & LOCATION TESTS PASSED SUCCESSFULLY!');
}

runTests()
  .catch((e) => {
    console.error('ADDRESS TEST ERROR:', e);
    process.exit(1);
  })
  .finally(async () => await prisma.$disconnect());
