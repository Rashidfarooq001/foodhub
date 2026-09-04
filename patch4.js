const fs = require('fs');
const checkoutPath = 'apps/customer-web/src/app/checkout/page.tsx';
let content = fs.readFileSync(checkoutPath, 'utf8');

content = content.replace(/\{item\.quantity\}[^<]*/g, "{item.quantity}\u00D7");

content = content.replace(/'PLACE ORDER [^']*'/g, "(<span className=\"flex items-center gap-1\">PLACE ORDER <ArrowRight className=\"w-4 h-4\" /></span>)");
content = content.replace(/'PROCEED TO PAYMENT [^']*'/g, "(<span className=\"flex items-center gap-1\">PROCEED TO PAYMENT <ArrowRight className=\"w-4 h-4\" /></span>)");

fs.writeFileSync(checkoutPath, content, 'utf8');
