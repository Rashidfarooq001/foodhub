const fs = require('fs');
let code = fs.readFileSync('apps/customer-web/src/components/home/LocationSelectorModal.tsx', 'utf8');

code = code.replace(/onSelectLocation: \(loc: \{ label: string; address: string; lat: number; lng: number; locationSource: string \}\) => void;\r?\n\}\) => void;\r?\n\}/, `onSelectLocation: (loc: { label: string; address: string; lat: number; lng: number; locationSource: string }) => void;\n}`);

fs.writeFileSync('apps/customer-web/src/components/home/LocationSelectorModal.tsx', code);
