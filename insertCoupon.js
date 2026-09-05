const fs = require('fs');
const file = 'apps/customer-web/src/app/checkout/page.tsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Add discount line to Price Breakdown
const discountLine = `
                  {discount > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Item Discount</span>
                      <span className="font-bold">-{formatCurrency(discount)}</span>
                    </div>
                  )}`;
content = content.replace(
  /<div className="flex justify-between">\s*<span>Item Total<\/span>\s*<span className="font-bold text-gray-900">\{formatCurrency\(subtotal\)\}<\/span>\s*<\/div>/,
  `<div className="flex justify-between">
                    <span>Item Total</span>
                    <span className="font-bold text-gray-900">{formatCurrency(subtotal)}</span>
                  </div>${discountLine}`
);

// 2. Add Coupon UI before Price Breakdown
const couponUI = `
               <div className="bg-white border-b border-gray-100 p-4">
                 <h2 className="text-xs font-black text-gray-800 tracking-wider mb-3 flex items-center gap-1.5 uppercase">
                   <Tag className="w-5 h-5 text-gray-900" /> Apply Coupon
                 </h2>
                 <div className="flex items-center gap-2">
                   <input
                     type="text"
                     placeholder="Enter coupon code"
                     className="flex-1 px-3 py-2 border border-gray-300 rounded text-sm uppercase"
                     value={useCartStore.getState().appliedCoupon || ''}
                     onChange={(e) => useCartStore.getState().applyCoupon(e.target.value.toUpperCase())}
                   />
                 </div>
                 {orderQuote?.couponMessage && (
                   <p className={"mt-2 text-xs " + (orderQuote.discountAmount > 0 ? "text-green-600" : "text-red-500")}>
                     {orderQuote.couponMessage}
                   </p>
                 )}
               </div>
               
               `;

content = content.replace(
  /<div className="bg-white border-b border-gray-100 p-4">\s*<h2 className="text-xs font-black text-gray-800 tracking-wider mb-3 flex items-center gap-1.5 uppercase">\s*<Banknote className="w-5 h-5 text-gray-900" \/> PRICE BREAKDOWN\s*<\/h2>/,
  couponUI + `<div className="bg-white border-b border-gray-100 p-4">
                 <h2 className="text-xs font-black text-gray-800 tracking-wider mb-3 flex items-center gap-1.5 uppercase">
                   <Banknote className="w-5 h-5 text-gray-900" /> PRICE BREAKDOWN
                 </h2>`
);

fs.writeFileSync(file, content);
console.log('Inserted Coupon UI');
