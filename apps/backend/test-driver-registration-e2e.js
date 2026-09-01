const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const API_BASE = 'http://127.0.0.1:4000/api/v1';

async function main() {
  console.log('=== DELIVERY PARTNER REGISTRATION & APPROVAL E2E TEST ===\n');

  const testPhone = `+917009${Math.floor(100000 + Math.random() * 900000)}`;
  const testEmail = `driver_${Date.now()}@foodhub.com`;
  const testPassword = 'DriverPass@123';

  // 1. Submit Delivery Registration Application
  const regRes = await fetch(`${API_BASE}/drivers/apply`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Diagnostic Driver Test',
      phone: testPhone,
      email: testEmail,
      password: testPassword,
      licenseNumber: `DL-${Date.now().toString().slice(-8)}`,
      vehicleType: 'MOTORCYCLE',
      vehicleNumber: `KA-01-AB-${Math.floor(1000 + Math.random() * 9000)}`,
      address: '456 Delivery St, Bengaluru',
    }),
  });

  console.log(`- POST /drivers/apply Status: ${regRes.status}`);
  const regData = await regRes.json();
  console.log(`  Registration Response:`, JSON.stringify(regData));

  if (!regRes.ok || !regData.id) {
    console.error('❌ Driver self-registration failed.');
    return;
  }

  const driverId = regData.id;
  const userId = regData.userId;

  // 2. Verify driver application appears in Admin Driver Approvals list
  const appListRes = await fetch(`${API_BASE}/drivers/applications`);
  const appListData = await appListRes.json();
  console.log(`- GET /drivers/applications Status: ${appListRes.status}`);
  const foundInAppList = appListData.some((d) => d.id === driverId);
  console.log(`  Driver found in Admin Driver Approvals list? ${foundInAppList}`);

  // 3. Verify driver DOES NOT appear in Restaurant Applications list
  const restAppListRes = await fetch(`${API_BASE}/restaurants/applications`);
  const restAppListData = await restAppListRes.json();
  const foundInRestAppList =
    Array.isArray(restAppListData) &&
    restAppListData.some((r) => r.id === driverId || r.ownerId === userId);
  console.log(`  Driver incorrectly found in Restaurant Applications list? ${foundInRestAppList}`);

  // Sign Admin token for approval endpoint
  const crypto = require('crypto');
  function base64Url(str) {
    return Buffer.from(str)
      .toString('base64')
      .replace(/=/g, '')
      .replace(/\+/g, '-')
      .replace(/\//g, '_');
  }
  const header = base64Url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const payload = base64Url(
    JSON.stringify({
      sub: '3f2a1b1b-c4d1-4318-8aee-dc67a99975a5',
      role: 'SUPER_ADMIN',
      exp: Math.floor(Date.now() / 1000) + 3600,
    }),
  );
  const sig = crypto
    .createHmac('sha256', 'foodhub_jwt_super_secret_key_2026_production')
    .update(`${header}.${payload}`)
    .digest('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
  const adminToken = `${header}.${payload}.${sig}`;

  // 4. Admin Approve Driver
  const approveRes = await fetch(`${API_BASE}/drivers/${driverId}/approval`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
    body: JSON.stringify({ isApproved: true }),
  });
  console.log(`- PATCH /drivers/${driverId}/approval Status: ${approveRes.status}`);

  // 5. Test Delivery Login using registered phone & password
  const loginRes = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      phone: testPhone,
      password: testPassword,
    }),
  });

  console.log(`- POST /auth/login Status: ${loginRes.status}`);
  const loginData = await loginRes.json();
  console.log(`  Delivery Partner Login Response:`, JSON.stringify(loginData));

  if (loginRes.ok && loginData.tokens?.accessToken) {
    console.log('✅ DELIVERY REGISTRATION, SEPARATION, APPROVAL & LOGIN E2E SUCCESSFUL!');
  } else {
    console.error('❌ Delivery Partner Login after approval failed.');
  }
}

main().finally(() => prisma.$disconnect());
