const fs = require('fs');
let code = fs.readFileSync('apps/customer-web/src/app/cart/page.tsx', 'utf8');

// Fix duplicate tax declaration
code = code.replace(
  "  const subtotal = getSubtotal();\n  const platformFee = 5; // To get dynamic platform fee, we need a config endpoint in cart. For now, let's leave it as a variable if we can.\n  const tax = getTaxAmount();\n  const deliveryFee = getDeliveryFee();\n  const tax = getTaxAmount();",
  '  const subtotal = getSubtotal();\n  const platformFee = 5;\n  const deliveryFee = getDeliveryFee();\n  const tax = getTaxAmount();',
);

fs.writeFileSync('apps/customer-web/src/app/cart/page.tsx', code, 'utf8');
console.log('Fixed cart page syntax error');
