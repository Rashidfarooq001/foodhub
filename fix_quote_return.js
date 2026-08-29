const fs = require('fs');
let code = fs.readFileSync('apps/backend/src/modules/tax/order-quote.service.ts', 'utf8');

code = code.replace(/totalCustomerTaxes: 0,/g, 'totalCustomerTaxes,');
code = code.replace(/const platformFee = pricingConfig\.platformFee;/g, 'const platformFee = config.platformFee;');
code = code.replace(/const totalCustomerTaxes = Math.round\(foodSubtotal \* \(\(pricingConfig.foodGstRate \|\| 0\) \/ 100\) \* 100\) \/ 100;/g, 'const totalCustomerTaxes = Math.round(foodSubtotal * ((config.foodGstRate || 0) / 100) * 100) / 100;');

fs.writeFileSync('apps/backend/src/modules/tax/order-quote.service.ts', code);
console.log('Fixed return values in order-quote');
