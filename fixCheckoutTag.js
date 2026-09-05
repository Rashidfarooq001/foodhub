const fs = require('fs');

const file = 'apps/customer-web/src/app/checkout/page.tsx';
let content = fs.readFileSync(file, 'utf8');

if (!content.includes('Tag,')) {
  content = content.replace(/Banknote,/g, 'Banknote,\n  Tag,');
}

fs.writeFileSync(file, content);
console.log('Added Tag');
