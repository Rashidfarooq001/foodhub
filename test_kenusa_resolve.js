const https = require('https');
const payload = JSON.stringify({ query: 'kenusa' });

const req = https.request({
  hostname: 'foodhub-backend-enq2.onrender.com',
  path: '/api/v1/location/resolve',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(payload)
  }
}, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => console.log('Resolve Kenusa:', data));
});
req.write(payload);
req.end();
