const fs = require('fs');
let code = fs.readFileSync('apps/customer-web/src/app/checkout/page.tsx', 'utf8');

const target = '<span>GST &amp; Taxes</span>';
const idx = code.indexOf(target);
if (idx > -1) {
  const start = code.substring(0, idx);
  const rest = code.substring(idx + target.length);
  const endSpan = rest.indexOf('</span>');
  const end = rest.substring(endSpan + 7);

  // Use unicode escape sequence for ₹
  code = start + target + '\n                    <span>\u20B9{tax}</span>' + end;

  // Also fix platform fee while we are at it
  const pfTarget = '<span>Platform Fee</span>';
  const pfIdx = code.indexOf(pfTarget);
  if (pfIdx > -1) {
    const pfStart = code.substring(0, pfIdx);
    const pfRest = code.substring(pfIdx + pfTarget.length);
    const pfEndSpan = pfRest.indexOf('</span>');
    const pfEnd = pfRest.substring(pfEndSpan + 7);
    code =
      pfStart + pfTarget + '\n                      <span>\u20B9{platformFee || 3}</span>' + pfEnd;
  }

  fs.writeFileSync('apps/customer-web/src/app/checkout/page.tsx', code, 'utf8');
  console.log('Fixed using Unicode Escape Sequence!');
}
