const fs = require('fs');
const path = require('path');
const file = path.join('apps', 'backend', 'src', 'modules', 'orders', 'order-lifecycle.service.ts');
let code = fs.readFileSync(file, 'utf8');

if (!code.includes('import { PaymentsService }')) {
  code = "import { PaymentsService } from '../payments/payments.service';\n" + code;
}

fs.writeFileSync(file, code);
