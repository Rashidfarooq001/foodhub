const fs = require('fs');
const checkoutPath = 'apps/customer-web/src/app/checkout/page.tsx';
let content = fs.readFileSync(checkoutPath, 'utf8');

content = content.replace(/<span className="text-xs font-black text-gray-900">.*?\{item\.price\}<\/span>/g, '<span className="text-xs font-black text-gray-900">{formatCurrency(item.price)}</span>');

fs.writeFileSync(checkoutPath, content, 'utf8');
