const https = require('https');

function testEndpoint() {
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
      console.log(`[${new Date().toISOString()}] STATUS: ${res.statusCode} | RESPONSE: ${data}`);
      if (data.includes('Mappls returned invalid coordinates') && !data.includes('debugData')) {
        setTimeout(testEndpoint, 15000); // Still old build
      } else if (res.statusCode === 502) {
        setTimeout(testEndpoint, 15000); // Deploying
      } else {
        console.log('DONE!');
      }
    });
  });

  req.on('error', e => {
    console.error(`[${new Date().toISOString()}] ERROR:`, e);
    setTimeout(testEndpoint, 15000);
  });

  req.write(payload);
  req.end();
}

console.log('Polling production endpoint for debug data...');
testEndpoint();
