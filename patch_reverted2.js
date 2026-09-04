const fs = require('fs');
const checkoutPath = 'apps/customer-web/src/app/checkout/page.tsx';
let content = fs.readFileSync(checkoutPath, 'utf8');

// Replace the corrupted rupee symbol with formatCurrency or explicitly ₹ if it was hardcoded
content = content.replace(/,1\{item\.price\}/g, "{formatCurrency(item.price)}");

fs.writeFileSync(checkoutPath, content, 'utf8');
