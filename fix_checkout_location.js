const fs = require('fs');

let code = fs.readFileSync('apps/customer-web/src/app/checkout/page.tsx', 'utf8');

// 1. Remove GooglePlacesAutocomplete and searchPlacesByName
code = code.replace(/import \{ GooglePlacesAutocomplete \} from '\.\.\/\.\.\/components\/map\/GooglePlacesAutocomplete';\r?\n/, '');
code = code.replace(/searchPlacesByName,\s*/g, '');
code = code.replace(/PlaceSearchResultItem,\s*/g, '');

// 2. State replacements
code = code.replace(/const \[placeSearchInput, setPlaceSearchInput\] = useState\(''\);\r?\n/, 'const [manualAddress, setManualAddress] = useState(\'\');\n');
code = code.replace(/const \[isSearchingPlace, setIsSearchingPlace\] = useState\(false\);\r?\n/, 'const [isVerifyingAddress, setIsVerifyingAddress] = useState(false);\n');
code = code.replace(/const \[placeCandidates, setPlaceCandidates\] = useState<PlaceSearchResultItem\[\]>\(\[\]\);\r?\n/, 'const [matchedAddressResult, setMatchedAddressResult] = useState<any>(null);\n');
code = code.replace(/const \[placeSearchError, setPlaceSearchError\] = useState<string \| null>\(null\);\r?\n/, 'const [addressVerificationError, setAddressVerificationError] = useState<string | null>(null);\n');

// 3. Remove handlePerformPlaceSearch and handleSelectPlaceCandidate
const handlerRegex = /\/\/ MODE 2 — Place-Name Location Search Handler[\s\S]*?setShowCustomAddressModal\(false\);\s*setPlaceSearchInput\(''\);\s*setPlaceCandidates\(\[\]\);\s*\};\r?\n/g;
code = code.replace(handlerRegex, `
  // MODE 2 — Manual Address Verification via Mappls Forward Geocoding
  const handleVerifyManualAddress = async () => {
    if (!manualAddress.trim()) return;
    setIsVerifyingAddress(true);
    setAddressVerificationError(null);
    setMatchedAddressResult(null);

    try {
      const res = await fetch(\`\${getApiBaseUrl()}/geolocation/forward-geocode\`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address: manualAddress.trim() }),
      });
      const data = await res.json();

      if (data.success && data.latitude && data.longitude) {
        setMatchedAddressResult({
          latitude: data.latitude,
          longitude: data.longitude,
          formattedAddress: data.formattedAddress || manualAddress.trim(),
        });
      } else {
        setAddressVerificationError("Couldn't find this address. Please enter a more specific address.");
      }
    } catch {
      setAddressVerificationError("Unable to verify this address right now. Please try again.");
    } finally {
      setIsVerifyingAddress(false);
    }
  };

  const handleConfirmManualAddress = () => {
    if (!matchedAddressResult) return;
    
    // Create new address
    const newAddr = {
      id: 'addr-manual-' + Date.now(),
      label: 'Manual Address',
      placeName: 'Manual Address',
      addressLine1: manualAddress.trim(),
      addressLine2: matchedAddressResult.formattedAddress,
      city: '',
      state: '',
      postalCode: '',
      latitude: matchedAddressResult.latitude,
      longitude: matchedAddressResult.longitude,
      locationSource: 'MAPPLS_GEOCODE' as const,
      verificationStatus: 'VERIFIED' as const,
      isDefault: false,
    };
    
    addAddress(newAddr);
    setSelectedAddress(newAddr.id);
    setShowCustomAddressModal(false);
    
    // Discard previous quotes/fees to force requote
    setQuote(null);
    setDeliveryFee(0);
    setOrderError(null);
    
    setManualAddress('');
    setMatchedAddressResult(null);
  };
`);

// 4. Update the "Change Location" button click handler
code = code.replace(/setPlaceSearchInput\(''\);\s*setPlaceCandidates\(\[\]\);\s*setPlaceSearchError\(null\);/g, `
setManualAddress('');
setMatchedAddressResult(null);
setAddressVerificationError(null);
`);

// 5. Replace the Search Modal UI
const modalUIRegex = /\{\/\* PLACE-NAME LOCATION SEARCH MODAL \(MODE 2 — NO MAP, NO 6-FIELD FORM\) \*\/\}\s*\{showCustomAddressModal && \([\s\S]*?\{\/\* PLACE NAME SEARCH FORM \*\/\}\s*<div className="space-y-4">[\s\S]*?<\/div>\s*<\/div>\s*<\/div>\s*\)\}/g;

const newModalUI = `{/* MANUAL ADDRESS MODAL */}
          {showCustomAddressModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
              <div className="w-full max-w-lg rounded-2xl bg-white p-4 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                  <div>
                    <h3 className="text-lg font-black text-gray-900 leading-tight">
                      Change Delivery Location
                    </h3>
                  </div>
                  <button
                    onClick={() => setShowCustomAddressModal(false)}
                    className="rounded-full p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-900 transition"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
  
                {/* MANUAL TEXT ENTRY */}
                <div className="space-y-4">
                  {!matchedAddressResult ? (
                    <>
                      <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                        Delivery Address
                      </label>
                      <textarea
                        value={manualAddress}
                        onChange={(e) => setManualAddress(e.target.value)}
                        placeholder="House 24, Kenusa, Dangarpora, Baramulla, Jammu & Kashmir 193201"
                        rows={4}
                        disabled={isVerifyingAddress}
                        className="w-full rounded-2xl border border-gray-200 p-4 text-sm font-bold text-gray-900 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 bg-gray-50 resize-none disabled:opacity-50 box-border"
                      />
                      
                      {addressVerificationError && (
                        <div className="flex items-start gap-2 rounded-xl bg-rose-50 p-3 text-xs font-bold text-rose-700 border border-rose-100">
                          <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                          <p>{addressVerificationError}</p>
                        </div>
                      )}
        
                      <button
                        onClick={handleVerifyManualAddress}
                        disabled={!manualAddress.trim() || isVerifyingAddress}
                        className="w-full flex items-center justify-center gap-2 rounded-2xl bg-orange-600 py-3.5 text-sm font-black text-white hover:bg-orange-700 transition disabled:opacity-50 disabled:bg-gray-300 shadow-sm"
                      >
                        {isVerifyingAddress ? 'Checking address...' : 'Save Location'}
                      </button>
                    </>
                  ) : (
                    <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 space-y-4 shadow-sm relative overflow-hidden">
                      <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500"></div>
                      
                      <div className="flex items-center gap-2 text-emerald-800">
                        <Check className="h-5 w-5 bg-emerald-100 rounded-full p-1 text-emerald-600" />
                        <h3 className="font-black">Address matched</h3>
                      </div>
                      
                      <div className="text-xs font-bold text-emerald-900/70 bg-emerald-100/50 p-3 rounded-xl">
                        ? Mappls verified location
                      </div>
                      
                      <div className="text-sm font-bold text-gray-900 leading-relaxed bg-white p-4 rounded-xl border border-emerald-100">
                        {matchedAddressResult.formattedAddress}
                      </div>
        
                      <div className="flex gap-2 pt-2">
                        <button
                          onClick={() => {
                            setMatchedAddressResult(null);
                            setAddressVerificationError(null);
                          }}
                          className="flex-1 rounded-xl bg-white border border-gray-200 py-3 text-xs font-bold text-gray-700 hover:bg-gray-50 transition"
                        >
                          Change Address
                        </button>
                        <button
                          onClick={handleConfirmManualAddress}
                          className="flex-1 rounded-xl bg-emerald-600 py-3 text-xs font-black text-white hover:bg-emerald-700 shadow-sm transition"
                        >
                          Use This Location
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}`;
code = code.replace(modalUIRegex, newModalUI);

// Fix the location display in checkout
const selectedLocationRegex = /<div className="font-medium text-gray-900 text-sm leading-snug break-words">[\s\S]*?\{selectedAddress\.label\}[\s\S]*?<\/div>[\s\S]*?<div className="text-xs text-gray-500 mt-0\.5 leading-relaxed break-words">[\s\S]*?\{selectedAddress\.addressLine1\}[\s\S]*?\{selectedAddress\.addressLine2 && \([\s\S]*?\{selectedAddress\.addressLine2\}[\s\S]*?\)\}[\s\S]*?<\/div>/g;

const newSelectedLocation = `<div className="font-medium text-gray-900 text-sm leading-snug break-words">
                        {selectedAddress.locationSource === 'MAPPLS_GEOCODE' ? 'MANUAL ADDRESS' : (selectedAddress.locationSource === 'CURRENT_GPS' ? 'CURRENT LOCATION' : selectedAddress.label)}
                      </div>
                      {selectedAddress.locationSource === 'MAPPLS_GEOCODE' && (
                        <div className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded flex items-center gap-1 mt-1 w-max">
                          <Check className="w-3 h-3" /> Mappls verified
                        </div>
                      )}
                      <div className="text-xs text-gray-500 mt-1.5 leading-relaxed break-words">
                        {selectedAddress.addressLine1}
                        {selectedAddress.addressLine2 && (
                          <span className="block mt-0.5">{selectedAddress.addressLine2}</span>
                        )}
                      </div>`;
code = code.replace(selectedLocationRegex, newSelectedLocation);

fs.writeFileSync('apps/customer-web/src/app/checkout/page.tsx', code);
console.log("Updated checkout page");
