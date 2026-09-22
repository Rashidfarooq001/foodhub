const fs = require('fs');
const file = 'apps/customer-web/src/data/mock-data.ts';
let code = fs.readFileSync(file, 'utf8');

code = code.replace(
  /\} else if \(foodItems\.length > 0\) \{\s*const avgPrice = foodItems\.reduce\(\(sum, item\) => sum \+ item\.price, 0\) \/ foodItems\.length;\s*priceForTwo = Math\.max\(100, Math\.round\(\(avgPrice \* 2\) \/ 50\) \* 50\);\s*\}/,
  '}'
);

fs.writeFileSync(file, code);
