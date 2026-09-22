const fs = require('fs');
const content = fs.readFileSync('apps/backend/src/modules/orders/orders.service.ts', 'utf8');
const newContent = content.replace(
  'if (!activeOrder) return null;',
  'if (!activeOrder) throw new NotFoundException(\'No active order found\');'
);
fs.writeFileSync('apps/backend/src/modules/orders/orders.service.ts', newContent);
