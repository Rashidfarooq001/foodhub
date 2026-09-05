const fs = require('fs');
const file = 'apps/customer-web/src/app/checkout/page.tsx';
let content = fs.readFileSync(file, 'utf8');

// 1. PAGE TITLE
content = content.replace(
  /<h1 className="text-sm font-black text-gray-900">Complete Your Order<\/h1>/,
  '<h1 className="text-lg font-bold text-gray-900">Complete Your Order</h1>'
);

// 2. SECTION HEADINGS
content = content.replace(
  /<h2 className="text-sm font-black text-gray-900 mb-2 flex items-center gap-1\.5">/g,
  '<h2 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-1.5">'
);
content = content.replace(
  /<h2 className="text-sm font-black text-gray-900 ">Wular Front<\/h2>/,
  '<h2 className="text-base font-semibold text-gray-900">Wular Front</h2>'
);
content = content.replace(
  /<h2 className="text-sm font-black text-gray-900 flex items-center gap-2">/g,
  '<h2 className="text-sm font-semibold text-gray-900 flex items-center gap-2">'
);
content = content.replace(
  /<h2 className="text-sm font-black text-gray-900 ">To Pay<\/h2>/g,
  '<h2 className="text-base font-semibold text-gray-900">To Pay</h2>'
);
content = content.replace(
  /<h2 className="text-xs font-black text-gray-500 r mb-3">You might also like<\/h2>/g,
  '<h2 className="text-sm font-semibold text-gray-900 mb-3">You might also like</h2>'
);
content = content.replace(
  /<h2 className="text-xs font-black text-gray-500 r flex items-center gap-1\.5">/g,
  '<h2 className="text-sm font-semibold text-gray-900 flex items-center gap-1.5">'
);
content = content.replace(
  /<h2 className="text-xs font-black text-gray-500 r">([^<]+)<\/h2>/g,
  '<h2 className="text-sm font-semibold text-gray-900 mb-2">$1</h2>'
);
content = content.replace(
  /className="text-xs font-black text-gray-500 r"/g,
  'className="text-sm font-semibold text-gray-900 mb-2"'
);


// 3. BODY TEXT & SMALL ELEMENTS
content = content.replace(
  /<p className="text-xs font-black text-gray-900 uppercase">([^<]+)<\/p>/g,
  '<p className="text-sm font-medium text-gray-900">$1</p>'
);
content = content.replace(
  /<span className="text-xs font-black text-gray-900 uppercase">([^<]+)<\/span>/g,
  '<span className="text-sm font-medium text-gray-900">$1</span>'
);
content = content.replace(
  /className="text-\[10px\] font-black text-orange-600  px-3 py-1 bg-orange-50 rounded-lg hover:bg-orange-100 transition shrink-0"/g,
  'className="text-xs font-medium text-orange-600 px-3 py-1 bg-orange-50 rounded-lg hover:bg-orange-100 transition shrink-0"'
);
content = content.replace(
  /className="text-\[10px\] font-black text-orange-600  px-2 py-1 bg-orange-50 rounded-lg hover:bg-orange-100 transition"/g,
  'className="text-xs font-medium text-orange-600 px-3 py-1.5 bg-orange-50 rounded-lg hover:bg-orange-100 transition"'
);

// 4. BILL DETAILS
content = content.replace(
  /className="text-xl font-black text-orange-600"/g,
  'className="text-xl font-bold text-gray-900"'
);

// 6. RECOMMENDED ITEMS (the item cards)
content = content.replace(
  /className="text-xs font-black text-gray-900 line-clamp-1"/g,
  'className="text-sm font-medium text-gray-900 line-clamp-1"'
);
content = content.replace(
  /className="text-xs font-black text-gray-900"([^>]*)>\{formatCurrency\(item\.price\)\}<\/span>/g,
  'className="text-sm font-medium text-gray-900"$1>{formatCurrency(item.price)}</span>'
);

// 7. STICKY PAYMENT CTA
const oldStickyCTA = /<div className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 p-3 pb-\[calc\(0\.75rem\+env\(safe-area-inset-bottom\)\)\] shadow-\[0_-10px_20px_rgba\(0,0,0,0\.05\)\]">[\s\S]*?<\/div>\s*<\/div>\s*<\/div>/;

const newStickyCTA = `<div className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] shadow-[0_-10px_40px_rgba(0,0,0,0.08)]">
          <div className="mx-auto max-w-2xl flex items-center justify-between gap-4">
            <div className="flex flex-col justify-center px-1">
              <span className="text-[11px] font-medium text-gray-500 uppercase tracking-wider mb-0.5">To Pay</span>
              <span className="text-xl font-bold text-gray-900">{formatCurrency(finalPayableTotal)}</span>
            </div>
            
            <button
              onClick={orderQuote && (!routeAvailable || realDistanceKm === null) ? () => refreshQuote() : handlePlaceOrder}
              disabled={isPlacing || !selectedAddress || Boolean(orderQuote && routeAvailable && realDistanceKm !== null && !isDeliveryEligible)}
              className="flex-[1.5] bg-orange-600 hover:bg-orange-700 active:scale-[0.98] transition-all duration-200 text-white font-semibold text-base rounded-2xl py-4 flex items-center justify-center gap-2 disabled:opacity-50 disabled:active:scale-100 shadow-lg shadow-orange-600/30"
            >
              {isPlacing 
                ? 'Processing...' 
                : !selectedAddress ? 'Select Address' 
                  : orderQuote && (!routeAvailable || realDistanceKm === null)
                    ? 'Check Distance'
                    : !isDeliveryEligible 
                      ? 'Out of Range' 
                      : (
                        <span className="flex items-center gap-2">
                          Pay {formatCurrency(finalPayableTotal)}
                          <ArrowRight className="w-5 h-5" />
                        </span>
                      )}
            </button>
          </div>
        </div>`;

content = content.replace(oldStickyCTA, newStickyCTA);

// Other font-black replacements to font-semibold or font-medium
content = content.replace(/font-black/g, 'font-semibold');

// Clean up weird stray characters like ' r ' or ' r</' in classNames
content = content.replace(/className="([^"]*) r"/g, 'className="$1"');

fs.writeFileSync(file, content);
console.log('Typography hierarchy applied');
