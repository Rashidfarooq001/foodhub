const fs = require('fs');
const file = 'apps/customer-web/src/components/home/RecommendedCard.tsx';
let code = fs.readFileSync(file, 'utf8');

code = code.replace(
  /const priceText =\s*restaurant\.priceForTwo && restaurant\.priceForTwo > 0\s*\?\s*`₹\$\{restaurant\.priceForTwo\} for two`\s*:\s*null;/g,
  'const priceText = restaurant.priceForTwo && restaurant.priceForTwo > 0 ? `₹${restaurant.priceForTwo} for two` : "Price not available";'
);

fs.writeFileSync(file, code);
