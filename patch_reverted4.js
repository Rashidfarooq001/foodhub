const fs = require('fs');
const checkoutPath = 'apps/customer-web/src/app/checkout/page.tsx';
let content = fs.readFileSync(checkoutPath, 'utf8');

content = content.replace(/,1\{/g, "{formatCurrency(");
content = content.replace(/,1([a-zA-Z0-9_.]+)/g, "{formatCurrency($1)}");

fs.writeFileSync(checkoutPath, content, 'utf8');
