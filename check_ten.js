const https = require('https');
https.get({
  hostname: 'api.github.com',
  path: '/repos/Rashidfarooq001/foodhub/deployments?per_page=100',
  headers: { 'User-Agent': 'node', 'Accept': 'application/vnd.github.v3+json' }
}, res => {
  let d = '';
  res.on('data', c => d += c);
  res.on('end', () => {
    const deps = JSON.parse(d);
    const tenDeps = deps.filter(d => d.environment.includes('ten'));
    console.log('Deployments with "ten" in environment:', tenDeps.length);
    tenDeps.forEach(dep => {
      console.log(`  ${dep.sha.substring(0,7)} | ${dep.environment} | ${dep.created_at}`);
    });
  });
});
