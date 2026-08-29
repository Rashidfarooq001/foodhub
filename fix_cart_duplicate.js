const fs = require('fs');
let code = fs.readFileSync('apps/customer-web/src/app/cart/page.tsx', 'utf8');

// Replace duplicate occurrences
const lines = code.split('\n');
let newLines = [];
let taxCount = 0;
for(const line of lines) {
  if (line.includes('const tax = getTaxAmount();')) {
    if (taxCount === 0) {
      newLines.push(line);
      taxCount++;
    }
  } else {
    newLines.push(line);
  }
}

fs.writeFileSync('apps/customer-web/src/app/cart/page.tsx', newLines.join('\n'), 'utf8');
console.log('Fixed syntax error');
