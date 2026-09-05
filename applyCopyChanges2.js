const fs = require('fs');
const file = 'apps/customer-web/src/app/checkout/page.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(/>\s*Total Bill\s*</gi, '>To Pay<');
content = content.replace(/>\s*PRICE BREAKDOWN\s*</gi, '>Bill Details<');
content = content.replace(/>\s*DELIVERY ADDRESS\s*</gi, '>Deliver to<');
content = content.replace(/>\s*DELIVERY TIME\s*</gi, '>When will it arrive?<');
content = content.replace(/>\s*RECOMMENDED ITEMS\s*</gi, '>You might also like<');
content = content.replace(/>\s*EDIT \/ ADD MORE\s*</gi, '>Edit order · Add more<');
content = content.replace(/>\s*PAY USING\s*</gi, '>Payment method<');
content = content.replace(/>\s*CHANGE\s*<\/button>/gi, '>Change</button>');

// Make sure 'uppercase tracking-wide' or 'uppercase' is removed from headings if it conflicts with sentence case
// e.g. `<h2 className="text-sm font-black text-gray-900 uppercase tracking-wide">To Pay</h2>`
content = content.replace(/uppercase tracking-wide/g, '');
content = content.replace(/uppercase tracking-wider/g, '');
// For the button in recommended items:
content = content.replace(
  /<button\s+onClick=\{[^}]+\}\s+className="absolute bottom-2 right-2 bg-white text-gray-900 shadow-md border border-gray-100 rounded-lg p-1\.5 active:scale-95 transition flex items-center justify-center"\s*>\s*<Plus className="w-4 h-4" \/>\s*<\/button>/g,
  `$&`.replace('<Plus className="w-4 h-4" />', '<Plus className="w-3 h-3" /> Add').replace('p-1.5', 'px-2.5 py-1.5 text-[10px] font-black gap-1')
);

// ETA unavailable
content = content.replace(/>\s*ETA unavailable\s*</gi, '>Delivery time will be shown soon<');

fs.writeFileSync(file, content);
console.log('Fixed more text');
