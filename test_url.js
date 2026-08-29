const https = require('https');
https.get('https://foodhub-customer-web-production.vercel.app/checkout', (res) => {
  console.log('Status:', res.statusCode);
}).on('error', e => console.log('Error:', e.message));
