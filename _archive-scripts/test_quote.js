const https = require('https');
const payload = JSON.stringify({
  restaurantId: '6cc40a5a-8b83-4903-8980-0a2a22238dbf',
  latitude: 34.422182,
  longitude: 74.610507,
  locationSource: 'MANUAL_GEOCODED',
});
const options = {
  hostname: 'foodhub-backend-enq2.onrender.com',
  path: '/api/v1/orders/quote',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(payload),
  },
};

const req = https.request(options, (res) => {
  let data = '';
  res.on('data', (chunk) => (data += chunk));
  res.on('end', () => console.log('RESPONSE:', res.statusCode, data));
});
req.write(payload);
req.end();
