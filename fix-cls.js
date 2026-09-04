const fs = require('fs');
let c = fs.readFileSync('apps/customer-web/src/components/home/CategoryCarousel.tsx', 'utf8');

c = c.replace(
  /\$\{isSelected \? 'ring-2 ring-rose-500 ring-offset-2 scale-110 shadow-md' : 'hover:scale-105 hover:shadow-md border border-gray-100'\}/,
  "\${isSelected ? 'ring-2 ring-rose-500 ring-offset-2 shadow-md border border-transparent' : 'hover:shadow-md border border-gray-100'}"
);

fs.writeFileSync('apps/customer-web/src/components/home/CategoryCarousel.tsx', c);
