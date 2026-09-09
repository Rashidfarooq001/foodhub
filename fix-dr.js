const fs = require('fs');
const path = require('path');
const file = path.join('apps', 'backend', 'src', 'modules', 'drivers', 'drivers.controller.ts');
let code = fs.readFileSync(file, 'utf8');
code = code.replace(/,\s*, Query \} from '@nestjs\/common';/, ',\n  Query\n} from \'@nestjs/common\';');
fs.writeFileSync(file, code);
