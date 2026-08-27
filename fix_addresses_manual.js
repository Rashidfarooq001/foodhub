const fs = require('fs');
let code = fs.readFileSync('apps/customer-web/src/app/addresses/page.tsx', 'utf8');

const modalRegex = /<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black\/60 backdrop-blur-sm">[\s\S]*?<\/div>\s*<\/div>\s*<\/div>\s*\)\}/g;

const newModalUi = `<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl bg-white p-4 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="text-lg font-black text-gray-900 leading-tight">Add Delivery Address</h3>
              <button onClick={() => setShowCustomAddressModal(false)} className="rounded-full p-2 text-gray-400 hover:bg-gray-100 transition">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                Enter your complete delivery address
              </label>
              <textarea
                value={manualAddress}
                onChange={(e) => setManualAddress(e.target.value)}
                placeholder="e.g. House No 24, Kenusa, Dangarpora, Baramulla, Jammu & Kashmir - 193201"
                rows={4}
                className="w-full rounded-2xl border border-gray-200 bg-gray-50 p-4 text-sm font-bold text-gray-900 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 resize-none box-border"
              />

              <button
                onClick={handleConfirmManualAddress}
                disabled={!manualAddress.trim()}
                className="w-full flex items-center justify-center gap-2 rounded-2xl bg-orange-600 py-3.5 text-sm font-black text-white hover:bg-orange-700 transition disabled:opacity-50 disabled:bg-gray-300 shadow-sm"
              >
                Save Location
              </button>
            </div>
          </div>
        </div>
      )}`;

code = code.replace(modalRegex, newModalUi);

// Handlers
const handlersRegex = /const handleVerifyManualAddress = async \(\) => \{[\s\S]*?const handleConfirmManualAddress = \(\) => \{[\s\S]*?setMatchedAddressResult\(null\);\s*\};\s*/g;

const newHandlers = `const handleConfirmManualAddress = () => {
    if (!manualAddress.trim()) return;
    
    const newAddr = {
      id: 'addr-manual-' + Date.now(),
      label: 'Manual Address',
      placeName: 'Manual Address',
      addressLine1: manualAddress.trim(),
      addressLine2: '',
      city: '',
      state: '',
      postalCode: '',
      latitude: undefined as any,
      longitude: undefined as any,
      locationSource: 'MANUAL_ADDRESS' as const,
      verificationStatus: 'UNVERIFIED' as const,
      isDefault: addresses.length === 0,
    };
    
    addAddress(newAddr);
    setShowCustomAddressModal(false);
    setManualAddress('');
  };
`;

code = code.replace(handlersRegex, newHandlers);

code = code.replace(/const \[isVerifyingAddress, setIsVerifyingAddress\] = useState\(false\);\r?\n/g, '');
code = code.replace(/const \[matchedAddressResult, setMatchedAddressResult\] = useState<any>\(null\);\r?\n/g, '');
code = code.replace(/const \[addressVerificationError, setAddressVerificationError\] = useState<string \| null>\(null\);\r?\n/g, '');

fs.writeFileSync('apps/customer-web/src/app/addresses/page.tsx', code);
