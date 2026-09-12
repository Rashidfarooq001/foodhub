const fs = require('fs');
const path = require('path');
function walk(dir) {
  let files = fs.readdirSync(dir);
  for (let f of files) {
    let p = path.join(dir, f);
    if (fs.statSync(p).isDirectory()) walk(p);
    else if (p.endsWith('.tsx') || p.endsWith('.ts')) {
      let code = fs.readFileSync(p, 'utf8');
      if (code.includes('formatCurrency(') && !code.includes('import { formatCurrency }')) {
        console.log("Fixing import in " + p);
        if (code.includes('use client')) {
           code = code.replace(/use client['"];?\r?\n/, "$&\nimport { formatCurrency } from '@foodhub/utils';\n");
        } else {
           const importMatch = /^import\s+.*from\s+['"].*['"];?\r?\n/m.exec(code);
           if (importMatch) {
             code = code.replace(/^import\s+.*from\s+['"].*['"];?\r?\n/m, "$&\nimport { formatCurrency } from '@foodhub/utils';\n");
           } else {
             code = "import { formatCurrency } from '@foodhub/utils';\n" + code;
           }
        }
        fs.writeFileSync(p, code);
      }
    }
  }
}
walk('apps/admin-dashboard/src');
walk('apps/delivery-dashboard/src');
walk('apps/hotel-dashboard/src');
walk('apps/customer-web/src');
