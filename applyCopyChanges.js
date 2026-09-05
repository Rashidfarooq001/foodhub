const fs = require('fs');

const file = 'apps/customer-web/src/app/checkout/page.tsx';
let content = fs.readFileSync(file, 'utf8');

// 1. PAGE HEADER
content = content.replace(
  /<h1 className="text-sm font-black uppercase tracking-wider text-gray-900">Payment<\/h1>/,
  '<h1 className="text-sm font-black text-gray-900">Complete Your Order</h1>'
);

// 2. CURRENT LOCATION / PICKUP SECTION
content = content.replace(
  /CURRENT LOCATION<\/h2>/g,
  'Pickup from</h2>'
);
content = content.replace(
  /<h2 className="text-xs font-black text-gray-900 mb-2 flex items-center gap-1\.5 uppercase tracking-wide">/g,
  '<h2 className="text-sm font-black text-gray-900 mb-2 flex items-center gap-1.5">'
);

// 3. RESTAURANT / CART SECTION
content = content.replace(
  />\s*EDIT \/ ADD MORE\s*</g,
  '>Edit order · Add more<'
);

// 4. RECOMMENDED ITEMS
content = content.replace(
  />\s*RECOMMENDED ITEMS\s*</g,
  '>You might also like<'
);
// For the add button
content = content.replace(
  /className="absolute bottom-2 right-2 bg-white text-gray-900 shadow-md border border-gray-100 rounded-lg p-1\.5 active:scale-95 transition flex items-center justify-center"\s*>\s*<Plus className="w-4 h-4" \/>\s*<\/button>/g,
  `className="absolute bottom-2 right-2 bg-white text-gray-900 shadow-md border border-gray-100 rounded-lg px-2.5 py-1.5 active:scale-95 transition flex items-center justify-center text-[10px] font-black gap-1"
                >
                  <Plus className="w-3 h-3" /> Add
                </button>`
);

// 5. DELIVERY TIME
content = content.replace(
  />\s*DELIVERY TIME\s*</g,
  '>When will it arrive?<'
);
content = content.replace(
  />\s*ETA unavailable\s*</g,
  '>Delivery time will be shown soon<'
);

// 6. DELIVERY ADDRESS
content = content.replace(
  />\s*DELIVERY ADDRESS\s*</g,
  '>Deliver to<'
);

// 7. PRICE BREAKDOWN
content = content.replace(
  />\s*PRICE BREAKDOWN\s*</g,
  '>Bill Details<'
);
content = content.replace(
  />\s*Item Total\s*</g,
  '>Food subtotal<'
);
content = content.replace(
  />\s*Delivery Fee\s*</g,
  '>Delivery<'
);
content = content.replace(
  />\s*Platform Fee\s*</g,
  '>Platform charges<'
);

// 8 & 11. TOTAL BILL -> To Pay
content = content.replace(
  />\s*TOTAL BILL\s*</g,
  '>To Pay<'
);
content = content.replace(
  /<span className="text-\[10px\] font-black text-gray-500 uppercase tracking-wider">Total<\/span>/g,
  '<span className="text-[10px] font-black text-gray-500 uppercase tracking-wider">To Pay</span>'
);

// 9. PAYMENT METHOD
content = content.replace(
  />\s*PAY USING\s*</g,
  '>Payment method<'
);

// Change all "CHANGE" buttons to "Change"
content = content.replace(
  />\s*CHANGE\s*<\/button>/g,
  '>Change</button>'
);

// Fix uppercases from headers
content = content.replace(
  /<h2 className="text-sm font-black text-gray-900 flex items-center gap-2 uppercase tracking-wide">/g,
  '<h2 className="text-sm font-black text-gray-900 flex items-center gap-2">'
);

// 10. STICKY PAYMENT CTA
// Current: PROCEED TO PAYMENT
// Change to: Pay ₹[DYNAMIC_TOTAL]
content = content.replace(
  /<span className="flex items-center gap-1">PROCEED TO PAYMENT <ArrowRight className="w-4 h-4" \/><\/span>/g,
  '<span className="flex items-center gap-1">Pay {formatCurrency(finalPayableTotal)} <ArrowRight className="w-4 h-4" /></span>'
);
content = content.replace(
  /<span className="flex items-center gap-1">PLACE ORDER <ArrowRight className="w-4 h-4" \/><\/span>/g,
  '<span className="flex items-center gap-1">Pay {formatCurrency(finalPayableTotal)} <ArrowRight className="w-4 h-4" /></span>'
);

fs.writeFileSync(file, content);
console.log('Done replacements');
