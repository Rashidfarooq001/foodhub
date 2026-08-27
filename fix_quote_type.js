const fs = require('fs');
let code = fs.readFileSync('apps/backend/src/modules/tax/order-quote.service.ts', 'utf8');

code = code.replace(/locationSource\?: 'CURRENT_GPS' \| 'MANUAL_GEOCODED' \| 'SAVED_ADDRESS';/g, "locationSource?: 'CURRENT_GPS' | 'MANUAL_GEOCODED' | 'SAVED_ADDRESS' | 'MANUAL_ADDRESS' | 'MAPPLS_GEOCODE';");

fs.writeFileSync('apps/backend/src/modules/tax/order-quote.service.ts', code);
