const fs = require('fs');
const path = require('path');

const dirs = [
  'apps/admin-dashboard/src',
  'apps/delivery-dashboard/src',
  'apps/hotel-dashboard/src'
];

function processDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      processDir(fullPath);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      const original = content;

      content = content.replace(/\\+\\?\\{([^\\}]+)\\}/g, '+{formatCurrency($1)}');
      content = content.replace(/-\\?\\{([^\\}]+)\\}/g, '-{formatCurrency($1)}');
      content = content.replace(/\\+₹\\{([^\\}]+)\\}/g, '+{formatCurrency($1)}');
      content = content.replace(/-₹^\{([^\\}]+)\\}/g, '-{formatCurrency($1)}');

      content = content.replace(/\\?\\{([^\\}]+)\\}/g, '{formatCurrency($1)}');
      content = content.replace(/₹^\{([^\\}]+)\\}/g, '{formatCurrency($1)}');

      if (content !== original && content.includes('formatCurrency') && !content.includes('formatCurrency } from')) {
        const importStmt = "import { formatCurrency } from '@foodhub/utils';\n";
        if (content.includes('use client')) {
           content = content.replace(/use client['l"];?\n/, "$&\n" + importStmt);
        } else {
           const importRegex = /^import\s+.*from\s+['"].*['"];?\r?\n/gm;
           let lastMatch = null, match;
           while ((match = importRegex.exec(content)) !== null) lastMatch = match;
           
           if (lastMatch) {
             const idx = lastMatch.index + lastMatch[0].length;
             content = content.substring(0, idx) + importStmt + content.substring(idx);
           } else {
             content = importStmt + content;
           }
        }
      }

      content = content.replace(/formatCurrency\((?:Number\()?([^\)]+>)(?:\))?\.toFixed\([0-9]+\)\)/g, 'formatCurrency(Number($1))');
      content = content.replace(/formatCurrency\(([^\)]+)\.toLocaleString\([^\)]*\)\)/g, 'formatCurrency(Number($1))');
      content = content.replace(/formatCurrency\((?:Number\()?([^\)]+?)\.toLocaleString\()\)?\)/g, 'formatCurrency(Number($1))');

      if (content !== original) {
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log('Updated ' + fullPath);
      }
    }
  }
}

dirs.forEach(processDir);