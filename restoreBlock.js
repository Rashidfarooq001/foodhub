const fs = require('fs');
const file = 'apps/customer-web/src/app/checkout/page.tsx';
let content = fs.readFileSync(file, 'utf8');

const brokenBlock = `          <div className="mx-auto max-w-2xl flex items-center gap-3">
                  : !selectedAddress ? 'SELECT ADDRESS' `;

const fixedBlock = `          <div className="mx-auto max-w-2xl flex items-center gap-3">
            <div className="flex flex-col justify-center px-2 min-w-[70px]">
              <span className="text-[10px] font-black text-gray-500 uppercase tracking-wider">Total</span>
              <span className="text-lg font-black text-gray-900">{formatCurrency(finalPayableTotal)}</span>
            </div>
            
            <button
              onClick={orderQuote && (!routeAvailable || realDistanceKm === null) ? () => refreshQuote() : handlePlaceOrder}
              disabled={isPlacing || !selectedAddress || Boolean(orderQuote && routeAvailable && realDistanceKm !== null && !isDeliveryEligible)}
              className="flex-1 bg-orange-600 hover:bg-orange-700 active:scale-[0.98] transition text-white font-black text-sm rounded-xl py-3.5 flex items-center justify-between px-5 disabled:opacity-50 disabled:active:scale-100 shadow-md shadow-orange-500/20"
            >
              <span>
                {isPlacing 
                  ? 'PROCESSING...' 
                  : !selectedAddress ? 'SELECT ADDRESS' `;

content = content.replace(brokenBlock, fixedBlock);
fs.writeFileSync(file, content);
console.log('Restored broken block');
