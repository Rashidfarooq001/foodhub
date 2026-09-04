const fs = require('fs');
const checkoutPath = 'apps/customer-web/src/app/checkout/page.tsx';
let content = fs.readFileSync(checkoutPath, 'utf8');

// 1. Fix Price Breakdown Icon
content = content.replace(/<span>dY'<\/span> Price Breakdown/g, '<Banknote className="w-5 h-5 text-gray-900" /> PRICE BREAKDOWN');
content = content.replace(/<span>dY'<\/span> Price Breakdown/g, '<Banknote className="w-5 h-5 text-gray-900" /> PRICE BREAKDOWN');
// (In case the string is slightly different)
content = content.replace(/<span>.*?<\/span>\s*Price Breakdown/g, '<Banknote className="w-5 h-5 text-gray-900" /> PRICE BREAKDOWN');


// 2. Fix Place Order Button Text
content = content.replace(/'PLACE ORDER \+''/g, "<>PLACE ORDER <ArrowRight className=\"w-4 h-4 ml-1 inline\" /></>");
content = content.replace(/'PROCEED TO PAYMENT \+''/g, "<>PROCEED TO PAYMENT <ArrowRight className=\"w-4 h-4 ml-1 inline\" /></>");

content = content.replace(/'PLACE ORDER \+''/g, "<>PLACE ORDER <ArrowRight className=\"w-4 h-4 ml-1 inline\" /></>");
content = content.replace(/'PROCEED TO PAYMENT \+''/g, "<>PROCEED TO PAYMENT <ArrowRight className=\"w-4 h-4 ml-1 inline\" /></>");

// 3. Fix Quantity Multiplier
content = content.replace(/\{item\.quantity\}A-/g, "{item.quantity}\u00D7");

// 4. Fix addAddress missing second parameter
content = content.replace(/addAddress\(newAddr as any\);/g, "addAddress(newAddr as any, true);");
content = content.replace(/addAddress\(gpsAddr\);/g, "addAddress(gpsAddr, true);");

// 5. Hardcode Current Location label to prevent "MANUAL ADDRESS" showing up there
content = content.replace(/\{currentLocation\?\.label \|\| 'CURRENT LOCATION'\}/g, "CURRENT LOCATION");

// 6. Reduce bottom padding
content = content.replace(/pb-28/g, "pb-24");

fs.writeFileSync(checkoutPath, content, 'utf8');
