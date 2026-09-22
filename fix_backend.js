const fs = require('fs');

const path = 'apps/backend/src/modules/menus/menus.service.ts';
let code = fs.readFileSync(path, 'utf8');

code = code.replace(/restaurant: \{ isOpen: true, isActive: true \}/g, "restaurant: { isOpen: true, status: 'APPROVED' }");

fs.writeFileSync(path, code, 'utf8');
console.log('Fixed menus.service.ts');
