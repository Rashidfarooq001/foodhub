const fs = require('fs');

let content = fs.readFileSync('apps/customer-web/src/app/page.tsx', 'utf8');

// I will target the container and the buttons inside it.
const oldFilterRow = `<div className="flex items-center flex-nowrap gap-2 overflow-x-auto pb-1 scrollbar-none -mx-4 px-4 sm:mx-0 sm:px-0">`;
const newFilterRow = `<div className="flex flex-nowrap gap-2.5 overflow-x-auto pb-2 pt-4 scrollbar-none -mx-4 px-4 sm:mx-0 sm:px-0" style={{ overscrollBehaviorX: 'contain' }}>`;

content = content.replace(oldFilterRow, newFilterRow);

// Now target all chips in this container.
const regexFilters = /className=\{`flex items-center gap-1\.5 rounded-xl border px-3 py-1\.5 text-xs font-bold whitespace-nowrap transition-all \$\{/g;
content = content.replace(regexFilters, 'className={`flex-shrink-0 flex items-center justify-center gap-1.5 h-[38px] rounded-full border px-[14px] text-xs font-bold whitespace-nowrap transition-all ${');

const regexChips = /className=\{`rounded-xl border px-3\.5 py-1\.5 text-xs font-bold whitespace-nowrap transition-all \$\{/g;
content = content.replace(regexChips, 'className={`flex-shrink-0 flex items-center justify-center h-[38px] rounded-full border px-[14px] text-xs font-bold whitespace-nowrap transition-all ${');

// Clear Filters Chip
const oldClear = `className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-bold text-rose-600 hover:bg-rose-100 transition-all whitespace-nowrap"`;
const newClear = `className="flex-shrink-0 flex items-center justify-center h-[38px] rounded-full border border-rose-200 bg-rose-50 px-[14px] text-xs font-bold text-rose-600 hover:bg-rose-100 transition-all whitespace-nowrap"`;
content = content.replace(oldClear, newClear);

fs.writeFileSync('apps/customer-web/src/app/page.tsx', content);
