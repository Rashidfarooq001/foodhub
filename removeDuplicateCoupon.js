const fs = require('fs');

const file = 'apps/customer-web/src/app/checkout/page.tsx';
let content = fs.readFileSync(file, 'utf8');

// Find the first occurrence of {/* 5.5. COUPON */}
const firstIndex = content.indexOf('{/* 5.5. COUPON */}');
// Find the next occurrence
const secondIndex = content.indexOf('{/* 5.5. COUPON */}', firstIndex + 1);

if (secondIndex !== -1) {
  // We need to cut out from the second {/* 5.5. COUPON */} up to the next {/* 6. PRICE BREAKDOWN */}
  const priceBreakdownIndex = content.indexOf('{/* 6. PRICE BREAKDOWN */}', secondIndex);
  if (priceBreakdownIndex !== -1) {
    const newContent = content.substring(0, secondIndex) + content.substring(priceBreakdownIndex);
    fs.writeFileSync(file, newContent);
    console.log('Removed duplicate coupon block');
  } else {
    console.log('Could not find price breakdown after second coupon block');
  }
} else {
  console.log('No duplicate found');
}
