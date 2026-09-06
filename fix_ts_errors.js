const fs = require('fs');

// 1. Fix order-quote.service.ts
const quoteFile = 'apps/backend/src/modules/tax/order-quote.service.ts';
let quoteContent = fs.readFileSync(quoteFile, 'utf8');

// Remove duplicate riderTip / totalRiderPayout lines
quoteContent = quoteContent.replace(
  /      const riderTip = tipAmount; \/\/ 100% pass-through\s+const totalRiderPayout =[\s\S]*?100,\s+\) \/ 100;/g,
  ''
);

// Remove duplicate deliveryFee properties
quoteContent = quoteContent.replace(
  /deliveryFeeBaseKm,\s+deliveryFeeBaseAmount,\s+deliveryFeeBaseKm: deliveryFeeBaseKm,\s+deliveryFeeBaseAmount: deliveryFeeBaseAmount,/g,
  'deliveryFeeBaseKm: deliveryFeeBaseKm,\n      deliveryFeeBaseAmount: deliveryFeeBaseAmount,'
);

fs.writeFileSync(quoteFile, quoteContent);
console.log('Fixed order-quote.service.ts');

// 2. Fix order-lifecycle.service.ts (invalid chars)
const lifecycleFile = 'apps/backend/src/modules/orders/order-lifecycle.service.ts';
let lifecycleContent = fs.readFileSync(lifecycleFile, 'utf8');

// Strip non-printable ASCII (like UTF-16 BOM artifacts) at the end of the file
lifecycleContent = lifecycleContent.replace(/[^\x20-\x7E\r\n\t]/g, '');

fs.writeFileSync(lifecycleFile, lifecycleContent);
console.log('Fixed order-lifecycle.service.ts');
