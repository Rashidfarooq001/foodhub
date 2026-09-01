const fs = require('fs');
const file = 'apps/customer-web/src/app/page.tsx';
let content = fs.readFileSync(file, 'utf8');
content = content.replace(
  'className="shrink-0"\n                aria-label="User Profile"',
  'className="shrink-0 md:hidden"\n                aria-label="User Profile"',
);
fs.writeFileSync(file, content, 'utf8');
