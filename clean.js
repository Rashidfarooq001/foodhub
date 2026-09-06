const fs = require('fs');
const file = 'apps/backend/src/modules/orders/order-lifecycle.service.ts';
let content = fs.readFileSync(file, 'utf8');

// Strip all non-ascii characters from the end of the file
let clean = content.replace(/[^\x00-\x7F]+$/g, '');
// Ensure it ends cleanly with brackets
clean = clean.replace(/\}\s*\}\s*\}\s*$/g, '}\n}\n');

fs.writeFileSync(file, clean);
console.log('Cleaned file');
