const fs = require('fs');
let code = fs.readFileSync('apps/customer-web/src/components/home/LocationSelectorModal.tsx', 'utf8');

const regex = /interface LocationSelectorModalProps \{[\s\S]*?\}/;
code = code.replace(regex, `interface LocationSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentLocality?: string;
  currentAddress?: string;
  onSelectLocation: (loc: { label: string; address: string; lat: number; lng: number; locationSource: string }) => void;
}`);

fs.writeFileSync('apps/customer-web/src/components/home/LocationSelectorModal.tsx', code);
