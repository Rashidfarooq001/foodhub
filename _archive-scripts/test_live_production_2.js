const https = require('https');

function loginAdmin() {
  return new Promise((resolve, reject) => {
    const req = https.request(
      {
        hostname: 'foodhub-backend-enq2.onrender.com',
        port: 443,
        path: '/api/v1/auth/login',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      },
      (res) => {
        let data = '';
        res.on('data', (c) => (data += c));
        res.on('end', () => resolve(JSON.parse(data).accessToken));
      },
    );
    req.write(JSON.stringify({ email: 'admin@foodhub.com', password: 'password123' }));
    req.end();
  });
}

function updateGst(token, rate) {
  return new Promise((resolve, reject) => {
    const req = https.request(
      {
        hostname: 'foodhub-backend-enq2.onrender.com',
        port: 443,
        path: '/api/v1/pricing/config',
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      },
      (res) => {
        let data = '';
        res.on('data', (c) => (data += c));
        res.on('end', () => {
          console.log(`Update to ${rate}% -> HTTP ${res.statusCode}: ${data}`);
          resolve();
        });
      },
    );
    req.write(JSON.stringify({ foodGstRate: rate }));
    req.end();
  });
}

async function run() {
  const token = await loginAdmin();
  await updateGst(token, 7);
}
run();
