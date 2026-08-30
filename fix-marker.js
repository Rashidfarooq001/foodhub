const fs = require('fs');
const path = 'apps/customer-web/src/components/tracking/LiveTrackingMap.tsx';
let content = fs.readFileSync(path, 'utf8');

// Replace marker creation logic
const oldMarker1 = /icon: 'https:\/\/cdn-icons-png.flaticon.com\/512\/3063\/3063822.png',\s*width: 40,\s*height: 40,/g;
content = content.replace(oldMarker1, `html: \`<div class="relative flex items-center justify-center w-10 h-10 bg-white rounded-full shadow-xl border-2 border-emerald-500 overflow-hidden"><img src="https://cdn-icons-png.flaticon.com/512/3063/3063822.png" style="width:24px;height:24px;object-fit:contain;" /></div>\`,\n          offset: [0, -20],`);

fs.writeFileSync(path, content, 'utf8');
