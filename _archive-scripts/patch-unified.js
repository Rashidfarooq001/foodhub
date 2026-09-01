const fs = require('fs');
const path = require('path');
const file = path.join(
  'apps',
  'backend',
  'src',
  'modules',
  'settlements',
  'settlements.service.ts',
);
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  /async getUnifiedTransactions\(\) \{ return \[\]; \}/g,
  `async getUnifiedTransactions(p1?: any, p2?: any, p3?: any) { return []; }`,
);

fs.writeFileSync(file, content, 'utf8');
console.log('Patched getUnifiedTransactions');
