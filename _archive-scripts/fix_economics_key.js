const fs = require('fs');
let code = fs.readFileSync('apps/backend/src/modules/pricing/unit-economics.service.ts', 'utf8');

code = code.replace(/taxes: number;/g, 'totalCustomerTaxes: number;');
code = code.replace(/const taxes = Math\.round/g, 'const totalCustomerTaxes = Math.round');
code = code.replace(/taxes,/g, 'totalCustomerTaxes,');
code = code.replace(
  /foodSubtotal \+ customerDeliveryFee \+ platformFee \+ taxes/g,
  'foodSubtotal + customerDeliveryFee + platformFee + totalCustomerTaxes',
);

fs.writeFileSync('apps/backend/src/modules/pricing/unit-economics.service.ts', code);
console.log('Fixed unit-economics to use totalCustomerTaxes');
