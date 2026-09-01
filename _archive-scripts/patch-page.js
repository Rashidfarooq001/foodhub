const fs = require('fs');
const file = 'apps/customer-web/src/app/page.tsx';
let content = fs.readFileSync(file, 'utf8');
content = content.replace(
  'className="flex flex-nowrap gap-2.5 overflow-x-auto pb-2 pt-4 scrollbar-none -mx-4 px-4 sm:mx-0 sm:px-0" style={{ overscrollBehaviorX: \'contain\' }}>',
  'className="flex flex-nowrap md:flex-wrap gap-2.5 overflow-x-auto md:overflow-x-visible pb-2 pt-4 md:pt-6 scrollbar-none -mx-4 px-4 sm:mx-0 sm:px-0" style={{ overscrollBehaviorX: \'contain\' }}>',
);
fs.writeFileSync(file, content, 'utf8');
