const fs = require('fs');
let c = fs.readFileSync('apps/customer-web/src/app/client.tsx', 'utf8');

c = c.replace(
  'export default function CustomerHomePage({ initialRestaurants = [] }: { initialRestaurants?: any[] }) {',
  'export default function CustomerHomePage({ initialRestaurants = [], initialCategories = [] }: { initialRestaurants?: any[], initialCategories?: any[] }) {'
);

c = c.replace(
  '<CategoryCarousel',
  '<CategoryCarousel initialCategories={initialCategories}'
);

fs.writeFileSync('apps/customer-web/src/app/client.tsx', c);
