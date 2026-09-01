const fs = require('fs');
let code = fs.readFileSync('apps/backend/src/modules/tax/order-quote.service.ts', 'utf8');

const regex =
  /if \(locationSource === 'MANUAL_ADDRESS'\) \{[\s\S]*?\} else if \(routeAvailable && distanceKm !== null && distanceKm >= 0\) \{/;

const replacement = `if (routeAvailable && distanceKm !== null && distanceKm >= 0) {`;

code = code.replace(regex, replacement);

fs.writeFileSync('apps/backend/src/modules/tax/order-quote.service.ts', code);
console.log('Modified order-quote.service.ts');
