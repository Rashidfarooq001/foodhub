const fs=require('fs'); 
let c=fs.readFileSync('apps/customer-web/src/app/checkout/page.tsx', 'utf8'); 
c = c.replace(/setNewDeliveryAddress\(gpsAddr\);/, ''); 
c = c.replace(/setSelectedAddressId\('current-location'\);/, 'setSelectedAddress(\'current-location\');'); 
fs.writeFileSync('apps/customer-web/src/app/checkout/page.tsx', c);
