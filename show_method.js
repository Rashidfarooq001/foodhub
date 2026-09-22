const fs = require('fs');
const content = fs.readFileSync('apps/backend/src/modules/orders/orders.service.ts', 'utf8');
const lines = content.split('\n');
const start = lines.findIndex(l => l.includes('async getActiveCustomerOrder'));
console.log(lines.slice(start, start + 50).join('\n'));
