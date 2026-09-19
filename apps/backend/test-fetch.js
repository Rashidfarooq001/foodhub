const jwt = require('jsonwebtoken');

async function testLive() {
  const token = jwt.sign(
    { sub: '05652576-b443-459b-aca4-7fbed63f2bed', phone: '+917006298795', role: 'SUPER_ADMIN', restaurantId: 'efcc61f1-7314-47a3-888e-aa14c1894c10' },
    'super-secret-jwt-key-foodhub-2026-enterprise',
    { expiresIn: '1d' }
  );

  console.log('Fetching with token...');
  const res = await fetch('https://api.zaykafood.online/api/v1/orders', {
    headers: { Authorization: 'Bearer ' + token },
    cache: 'no-store'
  });
  
  if (!res.ok) {
    console.log('Response NOT OK:', res.status);
    console.log(await res.text());
    return;
  }
  
  const data = await res.json();
  const rawList = Array.isArray(data) ? data : (data.orders ?? []);
  console.log('Received orders:', rawList.length);
}

testLive();
