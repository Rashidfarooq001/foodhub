const fs = require('fs');
const path = require('path');
function walk(dir) {
  let files = fs.readdirSync(dir);
  for (let f of files) {
    let p = path.join(dir, f);
    if (fs.statSync(p).isDirectory()) walk(p);
    else if (p.endsWith('.tsx') || p.endsWith('.ts')) {
      let code = fs.readFileSync(p, 'utf8');
      let o = code;
      
      code = code.replace(/\+\?\{([^}]+)\}/g, '+{formatCurrency($1)}');
      code = code.replace(/-\?\{([^}]+)\}/g, '-{formatCurrency($1)}');
      code = code.replace(/\?\{([^}]+)\}/g, '{formatCurrency($1)}');
      
      code = code.replace(/\+₹\{([^}]+)\}/g, '+{formatCurrency($1)}');
      code = code.replace(/-₹\{([^}]+)\}/g, '-{formatCurrency($1)}');
      code = code.replace(/₹\{([^}]+)\}/g, '{formatCurrency($1)}');
      
      code = code.replace(/formatCurrency\(([^)]+?)\.toFixed\([0-9]+\)\)/g, 'formatCurrency(Number($1))');
      code = code.replace(/formatCurrency\(Number\(([^)]+?)\)\.toFixed\([0-9]+\)\)/g, 'formatCurrency(Number($1))');
      code = code.replace(/formatCurrency\(([^)]+?)\.toLocaleString\([^)]*\)\)/g, 'formatCurrency(Number($1))');
      code = code.replace(/formatCurrency\(Number\(([^)]+?)\)\.toLocaleString\([^)]*\)\)/g, 'formatCurrency(Number($1))');

      if (code !== o) {
        if (!code.includes('import { formatCurrency }')) {
           if (code.includes('use client')) {
             code = code.replace(/use client['"];?\n/, "$&\nimport { formatCurrency } from '@foodhub/utils';\n");
           } else {
             const importMatch = /^import\s+.*from\s+['"].*['"];?\r?\n/m.exec(code);
             if (importMatch) {
               code = code.replace(/^import\s+.*from\s+['"].*['"];?\r?\n/m, "$&\nimport { formatCurrency } from '@foodhub/utils';\n");
             } else {
               code = "import { formatCurrency } from '@foodhub/utils';\n" + code;
             }
           }
        }
        fs.writeFileSync(p, code);
        console.log('Fixed ' + p);
      }
    }
  }
}
walk('apps/admin-dashboard/src');
walk('apps/delivery-dashboard/src');
walk('apps/hotel-dashboard/src');
walk('apps/customer-web/src');
