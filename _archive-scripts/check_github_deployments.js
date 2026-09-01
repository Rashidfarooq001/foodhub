const https = require('https');

https.get(
  {
    hostname: 'api.github.com',
    path: '/repos/Rashidfarooq001/foodhub/deployments?per_page=5',
    headers: { 'User-Agent': 'node', Accept: 'application/vnd.github.v3+json' },
  },
  (res) => {
    let d = '';
    res.on('data', (c) => (d += c));
    res.on('end', () => {
      console.log('HTTP:', res.statusCode);
      try {
        const deployments = JSON.parse(d);
        if (Array.isArray(deployments)) {
          deployments.forEach((dep) => {
            console.log(`\n--- Deployment ---`);
            console.log('  id:', dep.id);
            console.log('  sha:', dep.sha);
            console.log('  ref:', dep.ref);
            console.log('  environment:', dep.environment);
            console.log('  created_at:', dep.created_at);
            console.log('  updated_at:', dep.updated_at);
            console.log('  description:', dep.description);
            console.log('  creator:', dep.creator?.login);
          });
        } else {
          console.log('Response:', d.substring(0, 500));
        }
      } catch (e) {
        console.log('Raw:', d.substring(0, 500));
      }
    });
  },
);
