const https = require('https');

// Find the actual customer website URL - check the Vercel deployment
// First, try common patterns
const urls = [
  'https://foodhub-customer-web.vercel.app',
  'https://customer-web-foodhub.vercel.app',
  'https://foodhub.vercel.app',
  'https://zaykafood.vercel.app',
  'https://zaykafood-customer.vercel.app',
  'https://foodhub-customer.vercel.app'
];

let checked = 0;
urls.forEach(url => {
  const u = new URL(url);
  https.get({ hostname: u.hostname, path: '/', headers: { 'User-Agent': 'Mozilla/5.0' } }, res => {
    checked++;
    console.log(`${url} -> HTTP ${res.statusCode}`);
    if (checked === urls.length) console.log('\nDone.');
  }).on('error', e => {
    checked++;
    console.log(`${url} -> ERROR: ${e.message}`);
    if (checked === urls.length) console.log('\nDone.');
  });
});
