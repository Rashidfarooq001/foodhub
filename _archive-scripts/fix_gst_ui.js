const fs = require('fs');
let code = fs.readFileSync('apps/customer-web/src/app/checkout/page.tsx', 'utf8');

code = code.replace(
  /<span>GST &amp; Taxes<\/span>\s*<span>.*0<\/span>/g,
  '<span>GST &amp; Taxes</span>\n                    <span>?{tax}</span>',
);

fs.writeFileSync('apps/customer-web/src/app/checkout/page.tsx', code);
console.log('Fixed GST UI in checkout for real');
