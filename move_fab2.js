const fs = require('fs');
const file = 'apps/customer-web/src/app/restaurant/[slug]/client.tsx';
let code = fs.readFileSync(file, 'utf8');

code = code.replace(
  'className="fixed bottom-28 sm:bottom-32 right-4 sm:right-6 z-[100]"',
  'className={`fixed right-4 sm:right-6 z-[100] transition-all duration-300 ${cartItemCount > 0 ? "bottom-[124px] sm:bottom-[76px]" : "bottom-[72px] sm:bottom-8"}`}'
);

fs.writeFileSync(file, code, 'utf8');
console.log('Fixed FAB vertical positioning.');
