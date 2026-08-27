const fs = require('fs');
let code = fs.readFileSync('apps/customer-web/src/stores/use-address-store.ts', 'utf8');
code = code.replace(
  /locationSource\?: 'CURRENT_GPS' \| 'PLACE_SEARCH' \| 'SAVED_ADDRESS';/,
  "locationSource?: 'CURRENT_GPS' | 'PLACE_SEARCH' | 'SAVED_ADDRESS' | 'MAPPLS_GEOCODE';"
);
fs.writeFileSync('apps/customer-web/src/stores/use-address-store.ts', code);
