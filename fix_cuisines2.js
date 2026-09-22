const fs = require('fs');
const file = 'apps/customer-web/src/data/mock-data.ts';
let code = fs.readFileSync(file, 'utf8');

code = code.replace(
  /\} else if \(typeof r\.cuisine === 'string' && r\.cuisine\.trim\(\)\) \{\s*cuisines = r\.cuisine\s*\.split\(','\)\s*\.map\(\(c: string\) => c\.trim\(\)\)\s*\.filter\(Boolean\);\s*\}/,
  `} else if (typeof r.cuisine === 'string' && r.cuisine.trim()) {
    cuisines = r.cuisine.split(',').map((c: string) => c.trim()).filter(Boolean);
  } else if (Array.isArray(r.categories) && r.categories.length > 0) {
    cuisines = r.categories.map((c: any) => c.name).filter(Boolean);
  }`
);

fs.writeFileSync(file, code);
