const fs = require('fs');
const file = 'apps/backend/src/modules/orders/order-lifecycle.service.ts';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(/\}[^}]*$/s, '}');
content = content.replace(/\}[^}]*$/s, '}'); // Clean up any trailing weird characters

fs.writeFileSync(file, content + '\n}');
