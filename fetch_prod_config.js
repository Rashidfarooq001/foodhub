const https = require('https');
https.get('https://foodhub-backend-enq2.onrender.com/api/v1/pricing/config', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => console.log('Current Prod Config:', data));
});
