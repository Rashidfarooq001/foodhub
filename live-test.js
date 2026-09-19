const https = require('https');

function post(path, body) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const req = https.request({
      hostname: 'api.zaykafood.online',
      path: `/api/v1${path}`,
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) }
    }, res => {
      let raw = '';
      res.on('data', c => raw += c);
      res.on('end', () => resolve({ status: res.statusCode, body: raw }));
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

async function run() {
  console.log('=== TEST 1: Customer password login (existing user) ===');
  const r1 = await post('/auth/login', { phone: '9320646292', password: 'zayka@123', targetRole: 'CUSTOMER' });
  console.log('Status:', r1.status);
  const d1 = JSON.parse(r1.body);
  if (r1.status === 200) {
    console.log('✅ LOGIN PASSED - role:', d1.user?.role, 'phone:', d1.user?.phone);
  } else {
    console.log('❌ LOGIN FAILED:', d1.message);
  }

  console.log('\n=== TEST 2: Login with short password (6 chars) should be tested ===');
  // Test that DTO no longer rejects short passwords (bcrypt will handle it)
  const r2 = await post('/auth/login', { phone: '9991112223', password: 'short1', targetRole: 'CUSTOMER' });
  console.log('Status:', r2.status);
  const d2 = JSON.parse(r2.body);
  // Should get 401 (wrong password from bcrypt) NOT 400 (dto validation reject)
  if (r2.status === 401) {
    console.log('✅ SHORT PASSWORD: Got 401 (bcrypt reject) - DTO no longer blocks short passwords');
  } else if (r2.status === 400) {
    console.log('❌ SHORT PASSWORD: Still getting 400 - DTO MinLength still active');
  } else {
    console.log('Status:', r2.status, d2.message);
  }

  console.log('\n=== TEST 3: OTP login allowed for existing customer ===');
  console.log('(Cannot fully test without real OTP — checking send-otp works)');
  const r3 = await post('/auth/send-otp', { phone: '9320646292' });
  console.log('Status:', r3.status);
  const d3 = JSON.parse(r3.body);
  if (r3.status === 200) {
    console.log('✅ SEND OTP PASSED:', d3.message);
  } else {
    console.log('Status:', r3.status, d3.message);
  }
}

run().catch(console.error);
