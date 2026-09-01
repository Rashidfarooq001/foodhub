const fs = require('fs');

const path = 'apps/customer-web/src/app/checkout/page.tsx';
let code = fs.readFileSync(path, 'utf8');

const targetStart = '{showCustomAddressModal && (';
const targetEnd = ')}';

const startIndex = code.lastIndexOf(targetStart);
let braces = 0;
let endIndex = -1;

for (let i = startIndex; i < code.length; i++) {
  if (code[i] === '(') braces++;
  if (code[i] === ')') braces--;
  if (braces === 0) {
    endIndex = i;
    break;
  }
}

if (startIndex !== -1 && endIndex !== -1) {
  const newModal = `{showCustomAddressModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
            <div className="w-full max-w-[420px] overflow-hidden rounded-2xl bg-white shadow-2xl">
              <div className="flex items-center justify-between border-b border-gray-100 p-4 pb-3">
                <h2 className="text-base font-black text-gray-900">Change Delivery Location</h2>
                <button
                  onClick={() => setShowCustomAddressModal(false)}
                  className="rounded-full p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-900"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="p-4 pt-3 space-y-4">
                {/* MANUAL TEXT ENTRY */}
                <div className="space-y-2.5">
                  <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wider px-1">
                    Delivery Address
                  </label>
                  <textarea
                    value={manualAddress}
                    onChange={(e) => setManualAddress(e.target.value)}
                    placeholder="e.g. House No 24, Kenusa, Dangarpora, Baramulla, Jammu & Kashmir - 193201"
                    className="w-full rounded-xl border border-gray-200 bg-white p-3 text-sm font-bold text-gray-900 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 resize-none transition-all shadow-sm box-border h-[80px]"
                  />
                  <button
                    onClick={handleConfirmManualAddress}
                    disabled={!manualAddress.trim() || isVerifyingAddress}
                    className="w-full flex items-center justify-center rounded-xl bg-orange-600 h-[52px] text-sm font-black text-white hover:bg-orange-700 transition disabled:opacity-50 disabled:bg-gray-300 shadow-sm"
                  >
                    {isVerifyingAddress ? 'Verifying location...' : 'Save Location'}
                  </button>
                  {addressVerificationError && (
                    <p className="mt-1.5 text-[11px] font-bold text-red-500 text-center leading-tight">{addressVerificationError}</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}`;

  code = code.slice(0, startIndex) + newModal + code.slice(endIndex + 1);
  fs.writeFileSync(path, code);
  console.log('Successfully replaced modal');
} else {
  console.log('Modal not found');
}
