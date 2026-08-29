const fs = require('fs');
let code = fs.readFileSync('apps/customer-web/src/app/checkout/page.tsx', 'utf8');

// Just look for {tax} inside a span and replace the whole line!
code = code.replace(/<span[^>]*>.*\{tax\}.*<\/span>/g, '<span>?{tax}</span>');

fs.writeFileSync('apps/customer-web/src/app/checkout/page.tsx', code);
console.log('Fixed tax line');
