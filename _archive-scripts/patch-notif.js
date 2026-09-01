const fs = require('fs');
const file = 'apps/customer-web/src/app/page.tsx';
let content = fs.readFileSync(file, 'utf8');
content = content.replace(
  'href="/notifications"\n                className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-50 text-gray-700 hover:bg-gray-100 transition relative border border-gray-100 shrink-0"\n                aria-label="Notifications"',
  'href="/notifications"\n                className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-50 text-gray-700 hover:bg-gray-100 transition relative border border-gray-100 shrink-0 md:hidden"\n                aria-label="Notifications"',
);
fs.writeFileSync(file, content, 'utf8');
