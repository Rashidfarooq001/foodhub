const fs = require('fs');
let code = fs.readFileSync('apps/customer-web/src/app/checkout/page.tsx', 'utf8');

// Replace handleVerifyManualAddress with just an empty function to satisfy references temporarily
code = code.replace(/const handleVerifyManualAddress = async \(\) => \{[\s\S]*?\} finally \{[\s\S]*?setIsVerifyingAddress\(false\);[\s\S]*?\}[\s\S]*?\};/, `const handleVerifyManualAddress = async () => {};`);

// Update handleConfirmManualAddress to bypass the match requirement
code = code.replace(/const handleConfirmManualAddress = \(\) => \{[\s\S]*?if \(!matchedAddressResult\) return;/g, `const handleConfirmManualAddress = () => {
    if (!manualAddress.trim()) return;`);

// Update the newAddr creation
code = code.replace(/addressLine2: matchedAddressResult\.formattedAddress,[\s\S]*?city: '',[\s\S]*?state: '',[\s\S]*?postalCode: '',[\s\S]*?latitude: matchedAddressResult\.latitude,[\s\S]*?longitude: matchedAddressResult\.longitude,[\s\S]*?locationSource: 'MAPPLS_GEOCODE' as const,/g, `addressLine2: '',
      city: '',
      state: '',
      postalCode: '',
      latitude: undefined as any,
      longitude: undefined as any,
      locationSource: 'MANUAL_ADDRESS' as const,`);

// Update the UI: force matchedAddressResult to always be true in the ternary so it shows the second block?
// No, we want to hide the matched block and just use the first block.
// Wait, the first block HAS the "Verify Address" button!
// Let's replace the ternary entirely for the manual address block.
const uiRegex = /\{!matchedAddressResult \? \([\s\S]*?\) : \([\s\S]*?\)\}/;
code = code.replace(uiRegex, `<>
                        <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                          Delivery Address
                        </label>
                        <textarea
                          value={manualAddress}
                          onChange={(e) => setManualAddress(e.target.value)}
                          placeholder="e.g. House No 24, Kenusa, Dangarpora, Baramulla, Jammu & Kashmir - 193201"
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
