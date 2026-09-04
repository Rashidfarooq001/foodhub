const fs = require('fs');
const checkoutPath = 'apps/customer-web/src/app/checkout/page.tsx';
let content = fs.readFileSync(checkoutPath, 'utf8');

content = content.replace(/\{item\.quantity\}x/g, "{item.quantity}\u00D7");

fs.writeFileSync(checkoutPath, content, 'utf8');
