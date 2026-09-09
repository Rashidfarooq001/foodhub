const fs = require('fs');
const path = require('path');
const file = path.join('apps', 'backend', 'src', 'modules', 'orders', 'orders.service.ts');
let code = fs.readFileSync(file, 'utf8');

code = code.replace(
`}
    }

    // -----------------------------------------------------
    // RULE B: 5-HOUR MAXIMUM ORDER LIFECYCLE TIMEOUT`,
`}

    // -----------------------------------------------------
    // RULE B: 5-HOUR MAXIMUM ORDER LIFECYCLE TIMEOUT`
);

fs.writeFileSync(file, code);
