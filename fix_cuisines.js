const fs = require('fs');
const file = 'apps/customer-web/src/data/mock-data.ts';
let code = fs.readFileSync(file, 'utf8');

// Remove hardcoded cuisine fallback
code = code.replace(/let cuisines:\s*string\[\]\s*=\s*\['North Indian',\s*'Fast Food'\];/, 'let cuisines: string[] = [];');

fs.writeFileSync(file, code);
