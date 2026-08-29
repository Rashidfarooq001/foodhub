const https = require('https');

https.get({
  hostname: 'api.github.com',
  path: '/repos/Rashidfarooq001/foodhub/deployments?per_page=30',
  headers: { 'User-Agent': 'node', 'Accept': 'application/vnd.github.v3+json' }
}, res => {
  let d = '';
  res.on('data', c => d += c);
  res.on('end', () => {
    const deployments = JSON.parse(d);
    console.log('Total deployments returned:', deployments.length);
    console.log('\nAll environments:');
    const envs = {};
    deployments.forEach(dep => {
      const env = dep.environment;
      if (!envs[env]) envs[env] = [];
      envs[env].push({ sha: dep.sha.substring(0, 7), created: dep.created_at });
    });
    Object.entries(envs).forEach(([env, deps]) => {
      console.log(`\n${env}:`);
      deps.forEach(d => console.log(`  ${d.sha} @ ${d.created}`));
    });
    
    // Specifically look for customer-web
    const customerDeps = deployments.filter(d => 
      d.environment.includes('customer') || d.environment.includes('customer-web')
    );
    console.log('\n\n=== CUSTOMER-WEB DEPLOYMENTS ===');
    if (customerDeps.length === 0) {
      console.log('NONE FOUND in last 30 deployments!');
    } else {
      customerDeps.forEach(d => {
        console.log(`  ${d.sha.substring(0,7)} @ ${d.created_at} - ${d.environment}`);
      });
    }
  });
});
