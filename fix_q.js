const fs = require('fs');
let code = fs.readFileSync('apps/customer-web/src/app/checkout/page.tsx', 'utf8');

code = code.replace(/<span>\?\{tax\}<\/span>/g, '<span>?{tax}</span>');

fs.writeFileSync('apps/customer-web/src/app/checkout/page.tsx', code);
console.log('Fixed question mark in checkout');
