const https = require('https');

function testEndpoint() {
  const payload = JSON.stringify({ query: 'watapora' });
  const options = {
    hostname: 'foodhub-backend-enq2.onrender.com',
    path: '/api/v1/location/resolve',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(payload),
    },
  };

  const req = https.request(options, (res) => {
    let data = '';
    res.on('data', (chunk) => (data += chunk));
    res.on('end', () => {
      console.log(`[${new Date().toISOString()}] STATUS: ${res.statusCode} | RESPONSE: ${data}`);
      if (data.includes('success":true') && data.includes('latitude":34.')) {
        console.log('DONE!');
      } else {
        setTimeout(testEndpoint, 15000);
      }
    });
  });

  req.on('error', (e) => {
    console.error(`[${new Date().toISOString()}] ERROR:`, e);
    setTimeout(testEndpoint, 15000);
  });

  req.write(payload);
  req.end();
}

console.log('Polling production endpoint for success...');
testEndpoint();
