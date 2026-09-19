const https = require('https');

async function api(path, method = 'GET', body = null) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const req = https.request({
      hostname: 'api.zaykafood.online',
      path: '/api/v1' + path,
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(data ? { 'Content-Length': Buffer.byteLength(data) } : {})
      }
    }, res => {
      let result = '';
      res.on('data', chunk => result += chunk);
      res.on('end', () => resolve({ status: res.statusCode, data: JSON.parse(result || '{}') }));
    });
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

async function test() {
  const phone = '9991112223';
  const password = 'Password@123';
  
  console.log('Registering...');
  const regRes = await api('/auth/register', 'POST', {
    name: 'Test Customer',
    phone: phone,
    password: password,
    confirmPassword: password,
    termsAccepted: true
  });
  console.log('Register Res:', regRes);

  console.log('\nLogging in...');
  const loginRes = await api('/auth/login', 'POST', {
    phone: phone,
    password: password,
    targetRole: 'CUSTOMER'
  });
  console.log('Login Res:', loginRes);
}

test().catch(console.error);
