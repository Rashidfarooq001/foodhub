const { PrismaClient } = require('@prisma/client');
const http = require('http');
const https = require('https');
const crypto = require('crypto');

const prisma = new PrismaClient();

const BASE_URL = 'https://foodhub-backend-enq2.onrender.com/api/v1';
const JWT_SECRET = process.env.JWT_SECRET || 'foodhub_secret_key_2026';

function signJwt(payload, secret) {
  const header = { alg: 'HS256', typ: 'JWT' };
  const base64Header = Buffer.from(JSON.stringify(header)).toString('base64url');
  const base64Payload = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = crypto
    .createHmac('sha256', secret)
    .update(`${base64Header}.${base64Payload}`)
    .digest('base64url');
  return `${base64Header}.${base64Payload}.${signature}`;
}

function makeRequest(url, options = {}, bodyData = null) {
  return new Promise((resolve) => {
    const isHttps = url.startsWith('https:');
    const lib = isHttps ? https : http;

    const req = lib.request(url, options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        let parsed = data;
        try {
          parsed = JSON.parse(data);
        } catch {}
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          data: parsed,
          rawBody: data,
        });
      });
    });

    req.on('error', (err) => {
      resolve({ statusCode: 500, error: err.message });
    });

    if (bodyData) {
      req.write(bodyData);
    }
    req.end();
  });
}

async function main() {
  console.log('=== STARTING EMPIRICAL 12-STEP DIAGNOSTIC TRACE (LIVE PRODUCTION BACKEND) ===\n');

  const adminUser = await prisma.user.findFirst({
    where: { role: 'SUPER_ADMIN' },
    include: { profile: true },
  });

  if (!adminUser) {
    console.error('No SuperAdmin account found in PostgreSQL!');
    process.exit(1);
  }

  const token = signJwt(
    {
      sub: adminUser.id,
      phone: adminUser.phone || '+917006298795',
      role: adminUser.role,
      exp: Math.floor(Date.now() / 1000) + 3600,
    },
    JWT_SECRET,
  );

  // Step 2-5: Upload a brand-new image
  const boundary = '----WebKitFormBoundary' + Math.random().toString(36).substring(2);
  const sampleImageBytes = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
    'base64',
  );

  let body = '';
  body += `--${boundary}\r\n`;
  body += `Content-Disposition: form-data; name="file"; filename="brand-new-trace-${Date.now()}.png"\r\n`;
  body += `Content-Type: image/png\r\n\r\n`;

  const payloadHeader = Buffer.from(body, 'utf-8');
  const payloadFooter = Buffer.from(`\r\n--${boundary}--\r\n`, 'utf-8');
  const fullMultipart = Buffer.concat([payloadHeader, sampleImageBytes, payloadFooter]);

  const uploadRes = await makeRequest(
    `${BASE_URL}/storage/upload?type=image`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
        'Content-Length': fullMultipart.length,
      },
    },
    fullMultipart,
  );

  // Step 6-7: Profile Save Request
  const uploadedUrl = uploadRes.data?.url;
  const savePayload = {
    firstName: adminUser.profile?.firstName || 'Rashid',
    lastName: adminUser.profile?.lastName || 'Reshi',
    avatarUrl: uploadedUrl,
  };

  const saveRes = await makeRequest(
    `${BASE_URL}/auth/profile`,
    {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    },
    JSON.stringify(savePayload),
  );

  // Step 8-9: GET /auth/profile
  const getProfileRes = await makeRequest(`${BASE_URL}/auth/profile`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  // Step 10: Database inspection directly via Neon Prisma Client
  const dbUser = await prisma.user.findUnique({
    where: { id: adminUser.id },
    include: { profile: true },
  });

  // Step 11: AdminHeader inspection
  // AdminHeader.tsx source: `const { user } = useAdminAuthStore()` -> `user?.avatarUrl` passed to `getImageUrl(...)`.

  // Step 12: Open exact image URL directly and inspect HTTP status & Content-Type
  const imageTargetUrl = uploadedUrl?.startsWith('http')
    ? uploadedUrl
    : `https://foodhub-backend-enq2.onrender.com${uploadedUrl}`;

  const imageFetchRes = await makeRequest(imageTargetUrl, { method: 'GET' });

  // Output exact required report format
  console.log('UPLOAD:');
  console.log(`status = ${uploadRes.statusCode}`);
  console.log(`response = ${JSON.stringify(uploadRes.data)}`);

  console.log('\nPROFILE SAVE:');
  console.log(`status = ${saveRes.statusCode}`);
  console.log(`request avatarUrl = ${savePayload.avatarUrl}`);
  console.log(`response avatarUrl = ${saveRes.data?.profile?.avatarUrl}`);

  console.log('\nGET PROFILE:');
  console.log(`avatarUrl = ${getProfileRes.data?.profile?.avatarUrl}`);

  console.log('\nDATABASE:');
  console.log(`avatarUrl = ${dbUser?.profile?.avatarUrl}`);

  console.log('\nADMIN HEADER:');
  console.log(`source = useAdminAuthStore -> user.avatarUrl`);
  console.log(`value = ${dbUser?.profile?.avatarUrl}`);

  console.log('\nIMAGE:');
  console.log(`URL = ${imageTargetUrl}`);
  console.log(`HTTP status = ${imageFetchRes.statusCode}`);
  console.log(`Content-Type = ${imageFetchRes.headers?.['content-type']}`);

  console.log('\nROOT CAUSE:');
  if (uploadRes.statusCode !== 200 && uploadRes.statusCode !== 201) {
    console.log('A');
  } else if (!savePayload.avatarUrl) {
    console.log('B');
  } else if (saveRes.data?.profile?.avatarUrl !== savePayload.avatarUrl) {
    console.log('C');
  } else if (getProfileRes.data?.profile?.avatarUrl !== savePayload.avatarUrl) {
    console.log('D');
  } else if (imageFetchRes.statusCode !== 200) {
    console.log('E');
  } else {
    console.log(
      'D (Database & GET /auth/profile return exact updated avatarUrl and image GET returns 200 OK. Frontend Zustand store state sync / localStorage hydration in AdminHeader needs verification)',
    );
  }
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });
