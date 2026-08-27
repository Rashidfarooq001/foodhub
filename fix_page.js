const fs = require('fs');
let code = fs.readFileSync('apps/customer-web/src/app/page.tsx', 'utf8');

code = code.replace(/setLocationLabel\(loc\.label \|\| loc\.locality \|\| 'Selected Location'\);/g, "setLocationLabel(loc.label || 'Selected Location');");

fs.writeFileSync('apps/customer-web/src/app/page.tsx', code);
