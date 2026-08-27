const fs = require('fs');
let code = fs.readFileSync('apps/customer-web/src/app/checkout/page.tsx', 'utf8');

code = code.replace(/setQuote\(null\);\r?\n\s*setDeliveryFee\(0\);\r?\n\s*setOrderError\(null\);/g, 'setOrderQuote(null); setLocationError(null);');

fs.writeFileSync('apps/customer-web/src/app/checkout/page.tsx', code);
