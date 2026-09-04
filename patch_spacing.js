const fs = require('fs');
const checkoutPath = 'apps/customer-web/src/app/checkout/page.tsx';
let content = fs.readFileSync(checkoutPath, 'utf8');

// Replace the root div classes
content = content.replace(
  /<div className="bg-gray-50 text-gray-900 pb-24">/,
  '<div className="bg-gray-50 text-gray-900 -mb-20 md:mb-0">'
);

fs.writeFileSync(checkoutPath, content, 'utf8');
