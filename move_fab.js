const fs = require('fs');
const file = 'apps/customer-web/src/app/restaurant/[slug]/client.tsx';
let code = fs.readFileSync(file, 'utf8');

code = code.replace(
  'className="fixed bottom-28 sm:bottom-32 left-1/2 -translate-x-1/2 z-[100]"',
  'className="fixed bottom-28 sm:bottom-32 right-4 sm:right-6 z-[100]"'
);

fs.writeFileSync(file, code, 'utf8');
console.log('Moved MENU FAB to the right.');
