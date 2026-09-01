const fs = require('fs');
let code = fs.readFileSync('apps/customer-web/src/app/checkout/page.tsx', 'utf8');

const target = '<span>GST &amp; Taxes</span>';
const idx = code.indexOf(target);
if (idx > -1) {
  const start = code.substring(0, idx);
  const rest = code.substring(idx + target.length);
  // Find the next </span>
  const endSpan = rest.indexOf('</span>');
  const end = rest.substring(endSpan + 7);

  // Replace the middle with our new span
  code = start + target + '\n                    <span>?{tax}</span>' + end;
  fs.writeFileSync('apps/customer-web/src/app/checkout/page.tsx', code);
  console.log('Fixed block explicitly');
} else {
  console.log('Could not find target');
}
