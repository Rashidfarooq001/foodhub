const fs = require('fs');
let code = fs.readFileSync('apps/customer-web/src/app/checkout/page.tsx', 'utf8');
code = code.replace(/import \{ AddressPickerMap \} from '\.\.\/\.\.\/components\/map\/AddressPickerMap';\r?\n/, '');
fs.writeFileSync('apps/customer-web/src/app/checkout/page.tsx', code);
