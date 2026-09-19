const jwt = require('jsonwebtoken');

async function testMap() {
  const token = jwt.sign(
    { sub: '05652576-b443-459b-aca4-7fbed63f2bed', phone: '+917006298795', role: 'SUPER_ADMIN', restaurantId: 'efcc61f1-7314-47a3-888e-aa14c1894c10' },
    'super-secret-jwt-key-foodhub-2026-enterprise',
    { expiresIn: '1d' }
  );

  const r = await fetch('https://api.zaykafood.online/api/v1/orders', {
    headers: { Authorization: 'Bearer ' + token }
  });
  const data = await r.json();
  console.log('LIVE API DATA:', JSON.stringify(data, null, 2).substring(0, 500));
}

testMap();
