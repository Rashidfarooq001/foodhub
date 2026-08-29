const fs = require('fs');
const code = fs.readFileSync('apps/customer-web/src/app/checkout/page.tsx', 'utf8');
const lines = code.split('\n');
lines.forEach((line, i) => {
  if (line.includes('GST')) {
    console.log(`Line ${i + 1}:`, line);
    console.log(`Line ${i + 2}:`, lines[i + 1]);
  }
});
