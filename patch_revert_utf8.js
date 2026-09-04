const fs = require('fs');
const checkoutPath = 'apps/customer-web/src/app/checkout/page.tsx';
let content = fs.readFileSync(checkoutPath, 'utf8');

// 1. Fix Price Breakdown Icon
content = content.replace(/<span>.*?<\/span>\s*Price Breakdown/g, '<Banknote className="w-5 h-5 text-gray-900" /> PRICE BREAKDOWN');

// 2. Fix Place Order Button Text
content = content.replace(/'PLACE ORDER [^']*'/g, "(<span className=\"flex items-center gap-1\">PLACE ORDER <ArrowRight className=\"w-4 h-4\" /></span>)");
content = content.replace(/'PROCEED TO PAYMENT [^']*'/g, "(<span className=\"flex items-center gap-1\">PROCEED TO PAYMENT <ArrowRight className=\"w-4 h-4\" /></span>)");

// 3. Fix Quantity Multiplier
content = content.replace(/\{item\.quantity\}[^<]*<\/span>/g, "{item.quantity}\u00D7\n                       </span>");

// 4. Reduce bottom padding
content = content.replace(/pb-28/g, "pb-24");

// 5. Fix currencies (subtotal, etc.)
content = content.replace(/[^<]*,1\{([^}]+)\}/g, "{formatCurrency($1)}");
content = content.replace(/[^<]*,1([a-zA-Z0-9_.]+)/g, "{formatCurrency($1)}");

fs.writeFileSync(checkoutPath, content, 'utf8');
