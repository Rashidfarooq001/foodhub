const fs = require('fs');
let code = fs.readFileSync('apps/customer-web/src/app/cart/page.tsx', 'utf8');

// Add tax and platformFee from cart store if possible, but cart doesn't have orderQuote!
// Wait, cart page doesn't fetch orderQuote. It just displays fixed subtotal.
// We can just use the cartStore methods: getDeliveryFee(), getTaxAmount() (which might be 0 until checkout).

code = code.replace(
  /<span>Platform Fee<\/span>\s*<span>.*3<\/span>/g,
  '<span>Platform Fee</span>\n                <span>?{platformFee}</span>'
);

code = code.replace(
  /<span>GST &amp; Taxes<\/span>\s*<span>.*0<\/span>/g,
  '<span>GST &amp; Taxes</span>\n                <span>?{tax}</span>'
);

code = code.replace(
  'const { items, getSubtotal, getDeliveryFee, getGrandTotal } = useCartStore();',
  'const { items, getSubtotal, getDeliveryFee, getGrandTotal, getTaxAmount } = useCartStore();'
);

code = code.replace(
  'const subtotal = getSubtotal();',
  'const subtotal = getSubtotal();\n  const platformFee = 5; // To get dynamic platform fee, we need a config endpoint in cart. For now, let\'s leave it as a variable if we can.\n  const tax = getTaxAmount();'
);

fs.writeFileSync('apps/customer-web/src/app/cart/page.tsx', code);
console.log('Fixed cart page');
