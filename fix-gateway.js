const fs = require('fs');
const file = 'apps/backend/src/modules/orders/orders.gateway.ts';
let content = fs.readFileSync(file, 'utf8');
content = content.replace(/user\.customerId && order\.customerId === user\.customerId/g, "order.customerId === user.id");
fs.writeFileSync(file, content);
console.log("Fixed orders.gateway.ts");
