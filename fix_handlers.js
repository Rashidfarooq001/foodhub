const fs = require('fs');
let code = fs.readFileSync('apps/customer-web/src/app/checkout/page.tsx', 'utf8');

// 1. Remove handlePerformPlaceSearch completely
const handlePerformRegex = /const handlePerformPlaceSearch[\s\S]*?finally \{\s*setIsSearchingPlace\(false\);\s*\}\s*\};\r?\n/g;
code = code.replace(handlePerformRegex, '');

// 2. Remove handleSelectPlaceCandidate completely
const handleSelectRegex = /const handleSelectPlaceCandidate[\s\S]*?setPlaceSearchInput\(''\);\s*setPlaceCandidates\(\[\]\);\s*\};\r?\n/g;
code = code.replace(handleSelectRegex, '');

// 3. Inject new manual address handlers where the old ones were
const anchor = 'const fetchQuote = async (location: CustomerAddressItem, cartItemCount: number) => {';

const newHandlers = `
  // MODE 2: Manual Address Verification via Mappls Forward Geocoding
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
    
    setQuote(null);
    setDeliveryFee(0);
    setOrderError(null);
    
    setManualAddress('');
    setMatchedAddressResult(null);
  };
  
`;

code = code.replace(anchor, newHandlers + anchor);

// 4. Remove the leftover comment with the mangled dash
code = code.replace(/\/\/ MODE 2.*?Place-Name Location Search Handler\r?\n/g, '');

fs.writeFileSync('apps/customer-web/src/app/checkout/page.tsx', code);
