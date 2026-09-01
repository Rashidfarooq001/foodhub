const https = require('https');
https.get(
  {
    hostname: 'foodhub-customer-web.vercel.app',
    path: '/',
    headers: { 'User-Agent': 'node' },
  },
  (res) => {
    console.log('HTTP:', res.statusCode);
    console.log('Location:', res.headers.location);
  },
);
