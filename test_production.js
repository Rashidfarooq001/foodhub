const https = require('https');
const payload = JSON.stringify({ query: 'bandipora' });

const options = {
  hostname: 'foodhub-backend-enq2.onrender.com',
  path: '/api/v1/location/resolve',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(payload)
  }
};

const req = https.request(options, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log('STATUS:', res.statusCode);
    console.log('RESPONSE:', data);
  });
});

req.on('error', e => console.error(e));
req.write(payload);
req.end();
