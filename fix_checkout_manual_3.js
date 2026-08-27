const fs = require('fs');
let code = fs.readFileSync('apps/customer-web/src/app/checkout/page.tsx', 'utf8');

// Replace the handleVerifyManualAddress and handleConfirmManualAddress
const handlersRegex = /const handleVerifyManualAddress = async \(\) => \{[\s\S]*?const handleConfirmManualAddress = \(\) => \{[\s\S]*?setMatchedAddressResult\(null\);\s*\};\s*/;
code = code.replace(handlersRegex, `const handleConfirmManualAddress = () => {
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
      isDefault: false,
    };
    
    addAddress(newAddr);
    setSelectedAddress(newAddr.id);
    setShowCustomAddressModal(false);
    
    setOrderQuote(null);
    setLocationError(null);
    setManualAddress('');
  };\n`);

// Remove matched address states
code = code.replace(/const \[matchedAddressResult, setMatchedAddressResult\] = useState<any>\(null\);\r?\n/g, '');
code = code.replace(/const \[isVerifyingAddress, setIsVerifyingAddress\] = useState\(false\);\r?\n/g, '');
code = code.replace(/const \[addressVerificationError, setAddressVerificationError\] = useState<string \| null>\(null\);\r?\n/g, '');

// Replace the UI block
const uiBlockRegex = /\{!matchedAddressResult \? \([\s\S]*?\}<div className="flex gap-2 pt-2">[\s\S]*?setMatchedAddressResult\(null\);[\s\S]*?setAddressVerificationError\(null\);[\s\S]*?className="flex-1 rounded-xl bg-white border border-gray-200 py-3 text-xs font-bold text-gray-700 hover:bg-gray-50 transition"[\s\S]*?>[\s\S]*?Change Address[\s\S]*?<\/button>[\s\S]*?<button[\s\S]*?onClick=\{handleConfirmManualAddress\}[\s\S]*?className="flex-2 rounded-xl bg-orange-600 py-3 text-xs font-black text-white hover:bg-orange-700 transition shadow-sm"[\s\S]*?>[\s\S]*?Confirm & Save[\s\S]*?<\/button>[\s\S]*?<\/div>[\s\S]*?<\/div>[\s\S]*?\)\}/;
code = code.replace(uiBlockRegex, `<>
                        <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                          Delivery Address
                        </label>
                        <textarea
                          value={manualAddress}
                          onChange={(e) => setManualAddress(e.target.value)}
                          placeholder="House 24, Kenusa, Dangarpora, Baramulla, Jammu & Kashmir 193201"
                          rows={4}
                          className="w-full rounded-2xl border border-gray-200 p-4 text-sm font-bold text-gray-900 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 bg-gray-50 resize-none box-border"
                        />
          
                        <button
                          onClick={handleConfirmManualAddress}
                          disabled={!manualAddress.trim()}
                          className="w-full flex items-center justify-center gap-2 rounded-2xl bg-orange-600 py-3.5 text-sm font-black text-white hover:bg-orange-700 transition disabled:opacity-50 disabled:bg-gray-300 shadow-sm"
                        >
                          Save Location
                        </button>
                      </>`);

fs.writeFileSync('apps/customer-web/src/app/checkout/page.tsx', code);
