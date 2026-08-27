const fs = require('fs');
let code = fs.readFileSync('apps/customer-web/src/app/checkout/page.tsx', 'utf8');

const regexToRemove = /const handleVerifyManualAddress = async \(\) => \{[\s\S]*?const handleConfirmManualAddress = \(\) => \{[\s\S]*?if \(!matchedAddressResult\) return;\s*const newAddr = \{[\s\S]*?id: 'addr-manual-' \+ Date\.now\(\),[\s\S]*?label: 'Manual Address',[\s\S]*?placeName: 'Manual Address',[\s\S]*?addressLine1: manualAddress\.trim\(\),[\s\S]*?addressLine2: matchedAddressResult\.formattedAddress,[\s\S]*?city: '',[\s\S]*?state: '',[\s\S]*?postalCode: '',[\s\S]*?latitude: matchedAddressResult\.latitude,[\s\S]*?longitude: matchedAddressResult\.longitude,[\s\S]*?locationSource: 'MAPPLS_GEOCODE' as const,[\s\S]*?verificationStatus: 'VERIFIED' as const,[\s\S]*?isDefault: false,[\s\S]*?\};\s*addAddress\(newAddr\);\s*setSelectedAddress\(newAddr\.id\);\s*setShowCustomAddressModal\(false\);\s*setOrderQuote\(null\);\s*setLocationError\(null\);\s*setManualAddress\(''\);\s*setMatchedAddressResult\(null\);\s*\};\s*/g;

const newHandlers = `
  const handleConfirmManualAddress = () => {
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
  };
`;

code = code.replace(regexToRemove, newHandlers);

// Now update the UI part inside the modal
const uiRegex = /\{!matchedAddressResult \? \([\s\S]*?\}<div className="flex gap-2 pt-2">/g;

code = code.replace(uiRegex, `{true ? (
                      <>
                        <div className="relative">
                          <textarea
                            value={manualAddress}
                            onChange={(e) => {
                              setManualAddress(e.target.value);
                            }}
                            placeholder="e.g. House No 24, Kenusa, Dangarpora, Baramulla, Jammu & Kashmir - 193201"
                            className="w-full rounded-2xl border border-gray-200 bg-gray-50 p-4 text-sm font-bold text-gray-900 transition-all focus:border-orange-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-orange-500/10 min-h-[140px] resize-none"
                          />
                        </div>
          
                        <button
                          onClick={handleConfirmManualAddress}
                          disabled={!manualAddress.trim()}
                          className="w-full flex items-center justify-center gap-2 rounded-2xl bg-orange-600 py-3.5 text-sm font-black text-white hover:bg-orange-700 transition disabled:opacity-50 disabled:bg-gray-300 shadow-sm"
                        >
                          Save Location
                        </button>
                      </>
                    ) : (
                      <div className="flex gap-2 pt-2">`);

// Remove matchedAddressResult completely
code = code.replace(/const \[matchedAddressResult, setMatchedAddressResult\] = useState<any>\(null\);\r?\n/g, '');
code = code.replace(/const \[addressVerificationError, setAddressVerificationError\] = useState<string \| null>\(null\);\r?\n/g, '');
code = code.replace(/const \[isVerifyingAddress, setIsVerifyingAddress\] = useState\(false\);\r?\n/g, '');
code = code.replace(/<div className="text-sm font-bold text-gray-900 leading-relaxed bg-white p-4 rounded-xl border border-emerald-100">[\s\S]*?<\/div>\r?\n\s*<div className="flex gap-2 pt-2">[\s\S]*?setMatchedAddressResult\(null\);[\s\S]*?setAddressVerificationError\(null\);[\s\S]*?className="flex-1 rounded-xl bg-white border border-gray-200 py-3 text-xs font-bold text-gray-700 hover:bg-gray-50 transition"[\s\S]*?>[\s\S]*?Change Address[\s\S]*?<\/button>[\s\S]*?<button[\s\S]*?onClick=\{handleConfirmManualAddress\}[\s\S]*?className="flex-2 rounded-xl bg-orange-600 py-3 text-xs font-black text-white hover:bg-orange-700 transition shadow-sm"[\s\S]*?>[\s\S]*?Confirm & Save[\s\S]*?<\/button>[\s\S]*?<\/div>[\s\S]*?<\/div>[\s\S]*?\)\}/g, '');
code = code.replace(/\{!matchedAddressResult \? \(/g, '');
code = code.replace(/\) : \([\s\S]*?\)\}/g, '');

fs.writeFileSync('apps/customer-web/src/app/checkout/page.tsx', code);
