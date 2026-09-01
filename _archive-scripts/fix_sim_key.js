const fs = require('fs');
let code = fs.readFileSync('apps/admin-dashboard/src/app/settings/page.tsx', 'utf8');

code = code.replace(/simResults\.taxes/g, 'simResults.totalCustomerTaxes');

fs.writeFileSync('apps/admin-dashboard/src/app/settings/page.tsx', code);
console.log('Fixed simulator to use totalCustomerTaxes');
