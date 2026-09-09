const fs = require('fs');
const path = require('path');
const file = path.join('apps', 'backend', 'test', 'master-e2e.ts');
let code = fs.readFileSync(file, 'utf8');

code = code.replace(
/new OrderLifecycleService\(prisma, gateway, \{\} as any\);/,
"new OrderLifecycleService(prisma, gateway, {} as any, {} as any);"
);

fs.writeFileSync(file, code);
