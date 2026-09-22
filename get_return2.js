const fs = require('fs');
const file = 'apps/backend/src/modules/orders/orders.service.ts';
let code = fs.readFileSync(file, 'utf8');
const regex = /return serializePrisma\([\s\S]*?\)\s*\)/;
const match = code.match(regex);
console.log(match ? match[0] : "Not found");
