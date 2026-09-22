const fs = require('fs');
const file = 'apps/customer-web/src/app/layout.tsx';
let code = fs.readFileSync(file, 'utf8');

code = code.replace(/ZaykaFood â€” Fast Food Delivery in Kashmir \| ORDER â€¢ DELIVER â€¢ ENJOY/g, 'ZaykaFood – Fast Food Delivery in Kashmir | ORDER • DELIVER • ENJOY');
code = code.replace(/Zayka Food â€“ Online Food Delivery in Kashmir/g, 'ZaykaFood – Fast Food Delivery in Kashmir');
code = code.replace(/Zayka Food â€” Online Food Delivery in Kashmir/g, 'ZaykaFood – Fast Food Delivery in Kashmir');

fs.writeFileSync(file, code, 'utf8');
