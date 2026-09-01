const fs = require('fs');

let code = fs.readFileSync('apps/customer-web/src/app/cart/page.tsx', 'utf8');

// Add useEffect and fetchCartQuote
if (!code.includes('fetchCartQuote')) {
  code = code.replace(
    "import React, { useState } from 'react';",
    "import React, { useState, useEffect } from 'react';",
  );

  code = code.replace('getGrandTotal,', 'getGrandTotal,\n    orderQuote,\n    fetchCartQuote,');

  code = code.replace(
    'const subtotal = getSubtotal();',
    `const subtotal = getSubtotal();
  
  useEffect(() => {
    if (items.length > 0) {
      fetchCartQuote().catch(console.error);
    }
  }, [items.length, fetchCartQuote]);
`,
  );

  code = code.replace(
    "const platformFee = 5; // To get dynamic platform fee, we need a config endpoint in cart. For now, let's leave it as a variable if we can.",
    'const platformFee = orderQuote?.platformFee ?? 5;',
  );

  code = code.replace(
    'const tax = getTaxAmount();',
    'const tax = orderQuote?.totalCustomerTaxes ?? 0;',
  );

  code = code.replace(
    'const deliveryFee = getDeliveryFee();',
    'const deliveryFee = orderQuote?.customerDeliveryFee ?? 15;',
  );

  code = code.replace(
    'const grandTotal = getGrandTotal();',
    'const grandTotal = orderQuote?.customerTotal ?? getGrandTotal();',
  );

  fs.writeFileSync('apps/customer-web/src/app/cart/page.tsx', code, 'utf8');
}
