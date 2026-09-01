const http = require('http');

const req = http.request(
  {
    hostname: 'localhost',
    port: 3001,
    path: '/api/restaurants/5aad6d8f-84ca-4887-9849-ae2efa4a0e70/approval',
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
  },
  (res) => {
    let data = '';
    res.on('data', (chunk) => (data += chunk));
    res.on('end', () => console.log('Response:', res.statusCode, data));
  },
);

req.on('error', (e) => console.error(e));
req.write(JSON.stringify({ status: 'APPROVED' }));
req.end();
