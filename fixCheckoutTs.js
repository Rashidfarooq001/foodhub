const fs = require('fs');

const file = 'apps/customer-web/src/app/checkout/page.tsx';
let content = fs.readFileSync(file, 'utf8');

// Replace quoteData logic
content = content.replace(/useCartStore\.getState\(\)\.quoteData\?\.couponMessage/g, 'orderQuote?.couponMessage');
// Remove any duplicate coupon blocks if they exist (just in case)

fs.writeFileSync(file, content);
console.log('Fixed TS in checkout');
