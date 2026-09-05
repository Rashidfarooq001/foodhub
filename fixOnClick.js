const fs = require('fs');
const file = 'apps/customer-web/src/app/checkout/page.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  /onClick=\{orderQuote && \(\!routeAvailable \|\| realDistanceKm === null\) \? refreshQuote \: handlePlaceOrder\}/g,
  `onClick={orderQuote && (!routeAvailable || realDistanceKm === null) ? () => refreshQuote() : handlePlaceOrder}`
);

fs.writeFileSync(file, content);
console.log('Fixed onClick');
