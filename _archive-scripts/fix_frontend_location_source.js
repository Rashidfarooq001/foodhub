const fs = require('fs');
let code = fs.readFileSync(
  'apps/customer-web/src/components/home/LocationSelectorModal.tsx',
  'utf8',
);

code = code.replace(/locationSource: 'MANUAL_ADDRESS'/g, "locationSource: 'MANUAL_GEOCODED'");
fs.writeFileSync('apps/customer-web/src/components/home/LocationSelectorModal.tsx', code);
console.log('Modified LocationSelectorModal.tsx');

let code2 = fs.readFileSync('apps/customer-web/src/stores/use-address-store.ts', 'utf8');
code2 = code2.replace(
  /locationSource\?: 'CURRENT_GPS' \| 'PLACE_SEARCH' \| 'SAVED_ADDRESS' \| 'MANUAL_ADDRESS';/g,
  "locationSource?: 'CURRENT_GPS' | 'PLACE_SEARCH' | 'SAVED_ADDRESS' | 'MANUAL_ADDRESS' | 'MANUAL_GEOCODED';",
);
fs.writeFileSync('apps/customer-web/src/stores/use-address-store.ts', code2);
console.log('Modified use-address-store.ts');
