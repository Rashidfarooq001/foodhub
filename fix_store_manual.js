const fs = require('fs');
let code = fs.readFileSync('apps/customer-web/src/stores/use-address-store.ts', 'utf8');

code = code.replace(/'MAPPLS_GEOCODE'/g, "'MANUAL_ADDRESS'");

fs.writeFileSync('apps/customer-web/src/stores/use-address-store.ts', code);
