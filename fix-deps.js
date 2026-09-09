const fs = require('fs');
const path = require('path');

const pModPath = path.join('apps', 'backend', 'src', 'modules', 'payments', 'payments.module.ts');
let pMod = fs.readFileSync(pModPath, 'utf8');
pMod = pMod.replace(/import \{ Module \} from '@nestjs\/common';/, "import { Module, forwardRef } from '@nestjs/common';");
pMod = pMod.replace(/OrdersModule/g, "forwardRef(() => OrdersModule)");
pMod = pMod.replace(/import \{ forwardRef\(\(\) => OrdersModule\) \} from '\.\.\/orders\/orders\.module';/, "import { OrdersModule } from '../orders/orders.module';");
fs.writeFileSync(pModPath, pMod);

const oModPath = path.join('apps', 'backend', 'src', 'modules', 'orders', 'orders.module.ts');
let oMod = fs.readFileSync(oModPath, 'utf8');
oMod = oMod.replace(/import \{ Module \} from '@nestjs\/common';/, "import { Module, forwardRef } from '@nestjs/common';\nimport { PaymentsModule } from '../payments/payments.module';");
oMod = oMod.replace(/imports: \[(.*?)\]/, "imports: [$1, forwardRef(() => PaymentsModule)]");
fs.writeFileSync(oModPath, oMod);

console.log('Fixed module circular deps');
