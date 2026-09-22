const fs = require('fs');
const file = 'apps/customer-web/src/components/home/RecommendedCard.tsx';
let code = fs.readFileSync(file, 'utf8');

code = code.replace(
  /const priceText\s*=\s*restaurant\.priceForTwo\s*&&\s*restaurant\.priceForTwo\s*>\s*0\s*\?\s*`₹\$\{restaurant\.priceForTwo\}\s*for\s*two`\s*:\s*"Price not available";/,
  'const priceText = restaurant.priceForTwo && restaurant.priceForTwo > 0 ? `₹${restaurant.priceForTwo} for two` : null;'
);

fs.writeFileSync(file, code);
