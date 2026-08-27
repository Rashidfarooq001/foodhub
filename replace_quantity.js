const fs = require('fs');
const path = 'apps/customer-web/src/app/checkout/page.tsx';
let content = fs.readFileSync(path, 'utf8');

const oldBlock =             variantName: item.variantName || undefined,
            quantity: item.quantity,
            addonsJson:;

const newBlock =             variantName: item.variantName || undefined,
            quantity: item.quantity || 1,
            addonsJson:;

if (content.includes(oldBlock)) {
    content = content.replace(oldBlock, newBlock);
    fs.writeFileSync(path, content, 'utf8');
    console.log('Successfully replaced quantity fallback block.');
} else {
    console.log('Block not found.');
}
