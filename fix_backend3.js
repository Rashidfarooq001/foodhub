const fs = require('fs');

const path = 'apps/backend/src/modules/menus/menus.service.ts';
let code = fs.readFileSync(path, 'utf8');

code = code.replace(/isOnline: true/g, '');

// Clean up trailing commas in select: { ... }
code = code.replace(/,\s*\}/g, ' }');

fs.writeFileSync(path, code, 'utf8');
console.log('Removed isOnline');
