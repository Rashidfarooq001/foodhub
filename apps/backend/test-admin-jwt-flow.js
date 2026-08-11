const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');

const prisma = new PrismaClient();
const API_BASE = 'http://127.0.0.1:4000/api/v1';
const JWT_SECRET = process.env.JWT_SECRET || 'foodhub_jwt_super_secret_key_2026_production';

function base64UrlEncode(str) {
  return Buffer.from(str)
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

function signJwt(payload, secret) {
  const header = { alg: 'HS256', typ: 'JWT' };
  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const signature = crypto
    .createHmac('sha256', secret)
    .update(`${encodedHeader}.${encodedPayload}`)
    .digest('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
  return `${encodedHeader}.${encodedPayload}.${signature}`;
}

async function main() {
  console.log('=== ADMIN JWT PROFILE & MEDIA RETRIEVAL FLOW TRACE ===\n');

  const admin = await prisma.user.findFirst({
    where: { role: { in: ['SUPER_ADMIN', 'ADMIN'] } },
    include: { profile: true },
  });

  console.log(`- Target Admin: ID=${admin.id}, Phone=${admin.phone}, Role=${admin.role}`);

  // Create valid JWT signed with backend secret
  const token = signJwt(
    { sub: admin.id, phone: admin.phone, role: admin.role, sessionId: 'diag-session-123', exp: Math.floor(Date.now() / 1000) + 3600 },
    JWT_SECRET
  );

  console.log(`- Signed Admin JWT Token: ${token.slice(0, 30)}...`);

  // 1. GET /auth/profile
  const getRes = await fetch(`${API_BASE}/auth/profile`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  console.log(`- GET /auth/profile Status: ${getRes.status}`);
  const getData = await getRes.json();
  console.log(`  Current Profile in DB:`, JSON.stringify(getData));

  // 2. Upload test image using native Blob & FormData
  const imgBuffer = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
    'base64'
  );
  const blob = new Blob([imgBuffer], { type: 'image/png' });
  const form = new globalThis.FormData();
  form.append('file', blob, 'diag-avatar.png');

  const uploadRes = await fetch(`${API_BASE}/storage/upload?type=image`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  });

  console.log(`- Upload Image Status: ${uploadRes.status}`);
  if (uploadRes.ok) {
    const uploadData = await uploadRes.json();
    const newAvatarUrl = uploadData.url;
    console.log(`  Uploaded New Avatar URL: ${newAvatarUrl}`);

    // 3. PATCH /auth/profile
    const patchRes = await fetch(`${API_BASE}/auth/profile`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        firstName: 'Rashid',
        lastName: 'Reshi',
        avatarUrl: newAvatarUrl,
      }),
    });
    console.log(`- PATCH /auth/profile Status: ${patchRes.status}`);
    const patchData = await patchRes.json();
    console.log(`  PATCH Response Body:`, JSON.stringify(patchData));

    // 4. Test image retrieval from live URL
    const imgFetch = await fetch(newAvatarUrl);
    console.log(`- Image Fetch Status: ${imgFetch.status}, Content-Type: ${imgFetch.headers.get('content-type')}`);
  }
}

main().finally(() => prisma.$disconnect());
