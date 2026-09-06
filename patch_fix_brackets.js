const fs = require('fs');
const file = 'apps/backend/src/modules/orders/order-lifecycle.service.ts';
let content = fs.readFileSync(file, 'utf8');

// replace trailing brackets
content = content.replace(/\}\r?\n\}\r?\n\}\s*$/, '}\n}');
fs.writeFileSync(file, content);
