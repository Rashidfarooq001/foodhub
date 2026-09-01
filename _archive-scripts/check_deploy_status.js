const https = require('https');

// Check deployments again, specifically for customer-web after our fix
https.get(
  {
    hostname: 'api.github.com',
    path: '/repos/Rashidfarooq001/foodhub/deployments?per_page=10',
    headers: { 'User-Agent': 'node', Accept: 'application/vnd.github.v3+json' },
  },
  (res) => {
    let d = '';
    res.on('data', (c) => (d += c));
    res.on('end', () => {
      const deps = JSON.parse(d);
      console.log('Latest 10 deployments:');
      deps.forEach((dep) => {
        const isCustomer = dep.environment.includes('customer');
        const marker = isCustomer ? ' <<<<< CUSTOMER-WEB' : '';
        console.log(
          `  ${dep.sha.substring(0, 7)} | ${dep.environment.padEnd(45)} | ${dep.created_at}${marker}`,
        );
      });

      // Also check deployment status for the last customer-web deployment
      const lastCustomer = deps.find((d) => d.environment.includes('customer'));
      if (lastCustomer) {
        console.log('\nLast customer-web deployment:');
        console.log('  SHA:', lastCustomer.sha);
        console.log('  Created:', lastCustomer.created_at);

        // Get status
        https.get(
          {
            hostname: 'api.github.com',
            path: `/repos/Rashidfarooq001/foodhub/deployments/${lastCustomer.id}/statuses`,
            headers: { 'User-Agent': 'node', Accept: 'application/vnd.github.v3+json' },
          },
          (res2) => {
            let d2 = '';
            res2.on('data', (c) => (d2 += c));
            res2.on('end', () => {
              const statuses = JSON.parse(d2);
              console.log('  Statuses:');
              statuses.forEach((s) => {
                console.log(
                  `    ${s.state} @ ${s.created_at} - ${s.description || '(no description)'}`,
                );
                if (s.target_url) console.log(`    URL: ${s.target_url}`);
              });
            });
          },
        );
      }
    });
  },
);
