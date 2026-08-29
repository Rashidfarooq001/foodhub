const https = require('https');

https.get({
  hostname: 'api.github.com',
  path: '/repos/Rashidfarooq001/foodhub/deployments/6138582523/statuses',
  headers: { 'User-Agent': 'node', 'Accept': 'application/vnd.github.v3+json' }
}, res => {
  let d = '';
  res.on('data', c => d += c);
  res.on('end', () => {
    const statuses = JSON.parse(d);
    statuses.forEach(s => {
      console.log(`URL: ${s.target_url}`);
    });
  });
});
