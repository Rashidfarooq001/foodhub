const fs = require('fs');
const files = [
  'apps/customer-web/src/app/addresses/page.tsx',
  'apps/customer-web/src/app/categories/[id]/page.tsx',
  'apps/customer-web/src/app/categories/page.tsx',
  'apps/customer-web/src/app/favorites/page.tsx',
  'apps/customer-web/src/app/orders/[id]/track/page.tsx',
  'apps/customer-web/src/app/search/page.tsx',
  'apps/customer-web/src/app/support/page.tsx',
  'apps/customer-web/src/app/wishlist/page.tsx'
];
files.forEach(file => {
  if(fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    content = content.replace('className="mx-auto max-w-7xl px-4 py-5 sm:px-4 lg:px-5 space-y-4"', 'className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 space-y-6 md:space-y-8 pb-10"');
    content = content.replace('className="mx-auto max-w-7xl px-4 py-5 sm:px-4 lg:px-5 space-y-5"', 'className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 space-y-6 md:space-y-8 pb-10"');
    content = content.replace('className="mx-auto max-w-7xl px-4 py-5 sm:px-4 lg:px-5 space-y-4"', 'className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 space-y-6 md:space-y-8 pb-10"');
    fs.writeFileSync(file, content);
  }
});
console.log('Done');
