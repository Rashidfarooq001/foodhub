const fs = require('fs');
let code = fs.readFileSync('apps/customer-web/src/components/home/LocationSelectorModal.tsx', 'utf8');

// Update handlers
code = code.replace(/const handleVerifyManualAddress = async \(\) => \{[\s\S]*?\} finally \{[\s\S]*?setIsVerifyingAddress\(false\);[\s\S]*?\}[\s\S]*?\};/, `const handleVerifyManualAddress = async () => {};`);

code = code.replace(/const handleConfirmManualAddress = \(\) => \{[\s\S]*?if \(!matchedLocation\) return;/g, `const handleConfirmManualAddress = () => {
    if (!manualAddress.trim()) return;`);

code = code.replace(/addressLine2: matchedLocation\.formattedAddress,[\s\S]*?city: '',[\s\S]*?state: '',[\s\S]*?postalCode: '',[\s\S]*?latitude: matchedLocation\.latitude,[\s\S]*?longitude: matchedLocation\.longitude,[\s\S]*?locationSource: 'MAPPLS_GEOCODE' as const,[\s\S]*?verificationStatus: 'VERIFIED' as const,/g, `addressLine2: '',
      city: '',
      state: '',
      postalCode: '',
      latitude: undefined as any,
      longitude: undefined as any,
      locationSource: 'MANUAL_ADDRESS' as const,
      verificationStatus: 'UNVERIFIED' as const,`);

code = code.replace(/address: matchedLocation\.formattedAddress,[\s\S]*?lat: matchedLocation\.latitude,[\s\S]*?lng: matchedLocation\.longitude,[\s\S]*?locationSource: 'MAPPLS_GEOCODE',/g, `address: manualAddress.trim(),
      lat: undefined as any,
      lng: undefined as any,
      locationSource: 'MANUAL_ADDRESS',`);

const uiRegex = /\{!matchedLocation \? \([\s\S]*?\) : \([\s\S]*?\)\}/;
code = code.replace(uiRegex, `<>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
              Enter your complete delivery address
            </label>
            <textarea
              value={manualAddress}
              onChange={(e) => setManualAddress(e.target.value)}
              placeholder="e.g. House No 24, Kenusa, Dangarpora, Baramulla, Jammu & Kashmir - 193201"
              rows={4}
              className="w-full rounded-xl border border-gray-200 bg-white p-4 text-sm font-bold text-gray-900 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 resize-none box-border shadow-sm"
            />
            <button
              onClick={handleConfirmManualAddress}
              disabled={!manualAddress.trim()}
              className="w-full rounded-xl bg-orange-600 py-3.5 text-sm font-black text-white hover:bg-orange-700 transition disabled:opacity-50 disabled:bg-gray-300 shadow-sm"
            >
              Save Location
            </button>
          </>`);

fs.writeFileSync('apps/customer-web/src/components/home/LocationSelectorModal.tsx', code);
