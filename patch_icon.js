const fs = require('fs');
const modalPath = 'apps/customer-web/src/components/home/LocationSelectorModal.tsx';
let content = fs.readFileSync(modalPath, 'utf8');

content = content.replace(/Navigation2/g, 'MapPin');

fs.writeFileSync(modalPath, content, 'utf8');
