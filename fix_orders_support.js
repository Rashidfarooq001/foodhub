const fs = require('fs');

let c = fs.readFileSync('apps/backend/src/modules/orders/orders.controller.ts', 'utf8');
const cRegex = /\s*@Post\(':id\/support'\)[\s\S]*?async submitSupportTicket\([\s\S]*?\}[\s\S]*?\}/;
c = c.replace(cRegex, '');
fs.writeFileSync('apps/backend/src/modules/orders/orders.controller.ts', c);

let s = fs.readFileSync('apps/backend/src/modules/orders/orders.service.ts', 'utf8');
const sRegex = /\s*async submitSupportTicket\([\s\S]*?message: 'Support request submitted\. FoodHub Resolution Team will contact you within 15 minutes\.',\s*\}\);\s*\}/;
s = s.replace(sRegex, '');
fs.writeFileSync('apps/backend/src/modules/orders/orders.service.ts', s);
