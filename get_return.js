const fs = require('fs');
const file = 'apps/backend/src/modules/orders/orders.service.ts';
let code = fs.readFileSync(file, 'utf8');
const match = code.match(/getCustomerOrderHistory[\s\S]*?return[\s\S]*?\}/);
console.log(match ? match[0] : "Not found");
