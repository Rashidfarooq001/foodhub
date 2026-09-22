const fs = require('fs');
const file = 'apps/customer-web/src/components/restaurant/RestaurantCard.tsx';
let code = fs.readFileSync(file, 'utf8');

code = code.replace(
  /\{restaurant\.priceForTwo && restaurant\.priceForTwo > 0\s*\?\s*`₹\$\{restaurant\.priceForTwo\} for two`\s*:\s*'Price not available'\}/,
  '{restaurant.priceForTwo && restaurant.priceForTwo > 0 ? `₹${restaurant.priceForTwo} for two` : null}'
);

fs.writeFileSync(file, code);
