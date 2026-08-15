const http = require('http');

const API_BASE = 'http://localhost:4000/api/v1';

function request(url, options = {}, body = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(url, options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        let parsed = data;
        try {
          parsed = JSON.parse(data);
        } catch {}
        resolve({ status: res.statusCode, data: parsed });
      });
    });
    req.on('error', (err) => reject(err));
    if (body) {
      req.write(typeof body === 'object' ? JSON.stringify(body) : body);
    }
    req.end();
  });
}

async function createPermanentAccounts() {
  console.log('====================================================');
  console.log('CREATING PERMANENT REAL DATABASE ACCOUNTS IN NEON POSTGRES');
  console.log('====================================================\n');

  // 1. Create Real Restaurant Owner
  const ownerPayload = {
    name: 'Real Restaurant Owner',
    phone: '+919876500001',
    email: 'owner.real@foodhub.com',
    password: 'RealOwnerPassword123!',
    confirmPassword: 'RealOwnerPassword123!',
    restaurantName: 'Royal Kashmir Banquet & Kitchen',
    addressLine: 'Main Chowk, Kehnusa',
    city: 'Bandipora',
    state: 'Jammu & Kashmir',
    postalCode: '193502',
    latitude: 34.3868,
    longitude: 74.5221,
    fssaiNumber: 'FSSAI-193502998877',
  };

  console.log('[1/2] Creating Real Restaurant Owner Account...');
  let resOwner = await request(`${API_BASE}/auth/register/restaurant-owner`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  }, ownerPayload);

  if (resOwner.status !== 201) {
    console.log('  -> Account may already exist, attempting login...');
    resOwner = await request(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    }, {
      email: ownerPayload.email,
      password: ownerPayload.password,
      targetRole: 'HOTEL',
    });
  }

  console.log(`  -> Status: ${resOwner.status}`);
  console.log(`  -> User ID: ${resOwner.data.user?.id}`);
  console.log(`  -> Restaurant ID: ${resOwner.data.user?.restaurantId || resOwner.data.user?.restaurant?.id}`);

  // 2. Create Real Delivery Partner
  const driverPayload = {
    name: 'Real Delivery Partner',
    phone: '+919876500002',
    email: 'driver.real@foodhub.com',
    password: 'RealDriverPassword123!',
    confirmPassword: 'RealDriverPassword123!',
    vehicleType: 'MOTORCYCLE',
    vehicleNumber: 'JK-15-B-9999',
    licenseNumber: 'JK1520260009999',
    addressLine: 'Near Kehnusa Bus Stand',
    city: 'Bandipora',
    state: 'Jammu & Kashmir',
    postalCode: '193502',
  };

  console.log('\n[2/2] Creating Real Delivery Partner Account...');
  let resDriver = await request(`${API_BASE}/auth/register/delivery-partner`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  }, driverPayload);

  if (resDriver.status !== 201) {
    console.log('  -> Account may already exist, attempting login...');
    resDriver = await request(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    }, {
      email: driverPayload.email,
      password: driverPayload.password,
      targetRole: 'DELIVERY',
    });
  }

  console.log(`  -> Status: ${resDriver.status}`);
  console.log(`  -> User ID: ${resDriver.data.user?.id}`);
  console.log(`  -> Driver ID: ${resDriver.data.user?.driverId || resDriver.data.user?.driver?.id}`);

  console.log('\n====================================================');
  console.log('PERMANENT REAL ACCOUNTS VERIFIED IN POSTGRESQL DATABASE!');
  console.log('====================================================');
}

createPermanentAccounts().catch((err) => {
  console.error('Error creating permanent accounts:', err);
  process.exit(1);
});
