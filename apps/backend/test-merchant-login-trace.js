const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const API_BASE = 'http://127.0.0.1:4000/api/v1';
const crypto = require('crypto');

async function main() {
  console.log('=== MERCHANT REGISTRATION, APPROVAL & LOGIN TRACE ===\n');

  function base64Url(str) { return Buffer.from(str).toString('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_'); }
  const header = base64Url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const payload = base64Url(JSON.stringify({ sub: '3f2a1b1b-c4d1-4318-8aee-dc67a99975a5', role: 'SUPER_ADMIN', exp: Math.floor(Date.now() / 1000) + 3600 }));
  const sig = crypto.createHmac('sha256', 'foodhub_jwt_super_secret_key_2026_production').update(`${header}.${payload}`).digest('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  const adminToken = `${header}.${payload}.${sig}`;

  const testDigits = `${Math.floor(1000000000 + Math.random() * 9000000000)}`;
  const testPhone = `+91${testDigits}`;
  const testEmail = `merchant_${Date.now()}@foodhub.com`;
  const testPassword = 'MerchantPass@123';

  // 1. Submit Restaurant Registration
  const regRes = await fetch(`${API_BASE}/restaurants`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Diagnostic Spice Restaurant',
      ownerName: 'Diagnostic Merchant Owner',
      email: testEmail,
      phone: testPhone,
      password: testPassword,
      description: 'Fine dining',
      address: '100 MG Road',
      city: 'Bengaluru',
      state: 'Karnataka',
      country: 'India',
      pin: '560038',
      cuisines: ['North Indian', 'Biryani'],
    }),
  });

  console.log(`- POST /restaurants Status: ${regRes.status}`);
  const regData = await regRes.json();
  console.log(`  Registration Response:`, JSON.stringify(regData));

  if (!regRes.ok || !regData.id) {
    console.error('❌ Restaurant registration failed.');
    return;
  }

  const restaurantId = regData.id;
  const ownerId = regData.ownerId;

  // 2. Approve Restaurant via Prisma DB update directly
  await prisma.restaurant.update({
    where: { id: restaurantId },
    data: { status: 'APPROVED', isOpen: true },
  });
  await prisma.user.update({
    where: { id: ownerId },
    data: { isVerified: true, isActive: true },
  });
  console.log(`- Approved Restaurant ID=${restaurantId} in DB`);

  // 3. Test Merchant Login with FULL E.164 phone (+91...)
  const loginFullRes = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      phone: testPhone,
      password: testPassword,
      targetRole: 'HOTEL',
    }),
  });
  console.log(`- POST /auth/login (Full Phone +91...) Status: ${loginFullRes.status}`);
  const loginFullData = await loginFullRes.json();
  console.log(`  Login Response:`, JSON.stringify(loginFullData));

  // 4. Test Merchant Login with 10-digit raw phone (without +91)
  const loginRawRes = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      phone: testDigits,
      password: testPassword,
      targetRole: 'HOTEL',
    }),
  });
  console.log(`- POST /auth/login (Raw 10-digit Phone) Status: ${loginRawRes.status}`);
  const loginRawData = await loginRawRes.json();
  console.log(`  Login Response:`, JSON.stringify(loginRawData));
}

main().finally(() => prisma.$disconnect());
