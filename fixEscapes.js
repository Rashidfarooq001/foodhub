const fs = require('fs');
let content = fs.readFileSync('apps/admin-dashboard/src/app/coupons/page.tsx', 'utf8');
content = content.replace(/\\`/g, '`');
content = content.replace(/\\\$/g, '$');
fs.writeFileSync('apps/admin-dashboard/src/app/coupons/page.tsx', content);
