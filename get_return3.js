const fs = require('fs');
const file = 'apps/backend/src/modules/orders/orders.service.ts';
let code = fs.readFileSync(file, 'utf8');
const start = code.indexOf('getCustomerOrderHistory(');
const str = code.substring(start, start + 3000);
console.log(str);
