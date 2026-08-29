const https = require('https');

// Check if Vercel has the latest deployment by looking at the deployment API
// Try to find X-Vercel-Id or deployment info in response headers
https.get({
  hostname: 'foodhub-customer-web-ten.vercel.app',
  path: '/',
  headers: { 'User-Agent': 'Mozilla/5.0' }
}, res => {
  console.log('=== RESPONSE HEADERS ===');
  Object.entries(res.headers).forEach(([k, v]) => {
    console.log(`${k}: ${v}`);
  });
});
