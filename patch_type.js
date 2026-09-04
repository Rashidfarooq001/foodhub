const fs = require('fs');
const modalPath = 'apps/customer-web/src/components/home/LocationSelectorModal.tsx';
let content = fs.readFileSync(modalPath, 'utf8');

content = content.replace(
  /import \{ useAddressStore, CustomerAddressItem \} from '\.\.\/\.\.\/stores\/use-address-store';/,
  "import { useAddressStore } from '../../stores/use-address-store';\nimport type { CustomerAddressItem } from '../../stores/use-address-store';"
);

fs.writeFileSync(modalPath, content, 'utf8');
