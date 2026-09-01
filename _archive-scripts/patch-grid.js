const fs = require('fs');
const file = 'apps/customer-web/src/app/page.tsx';
let content = fs.readFileSync(file, 'utf8');
content = content.replaceAll(
  'md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
  'md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3',
);
fs.writeFileSync(file, content, 'utf8');
