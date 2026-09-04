const fs = require('fs');
const path = require('path');

const checkoutPath = 'apps/customer-web/src/app/checkout/page.tsx';
let content = fs.readFileSync(checkoutPath, 'utf8');

// 1. Add formatCurrency import
if (!content.includes('import { formatCurrency }')) {
  content = content.replace("import { useGeolocation }", "import { useGeolocation } from '../../hooks/useGeolocation';\nimport { formatCurrency } from '@foodhub/utils';");
}

// 2. Update useAddressStore destructuring
content = content.replace(
  "const { addresses, selectedAddressId, setSelectedAddress, getSelectedAddress, addAddress } =\n    useAddressStore();",
  "const { addresses, selectedAddressId, setSelectedAddress, getSelectedAddress, addAddress, getDeliveryAddress, setDeliveryAddress } = useAddressStore();"
);

// 3. Replace selectedAddress variable declaration
content = content.replace(
  "const selectedAddress = getSelectedAddress();",
  "const currentLocation = getSelectedAddress();\n  const deliveryAddress = getDeliveryAddress();"
);

// 4. Update refreshQuote to use deliveryAddress
content = content.replace(
  /const hasCoords =\s+selectedAddress\?.latitude/g,
  "const hasCoords = deliveryAddress?.latitude"
);
content = content.replace(
  /selectedAddress\?.latitude !== undefined &&\s+selectedAddress\?.longitude !== null &&\s+selectedAddress\?.longitude !== undefined/g,
  "deliveryAddress?.latitude !== undefined && deliveryAddress?.longitude !== null && deliveryAddress?.longitude !== undefined"
);
content = content.replace(
  /\(selectedAddress as any\)\?.locationSource \|\|\s+\(selectedAddress\?.id === 'current-location' \? 'CURRENT_GPS' : 'MANUAL_GEOCODED'\)/g,
  "(deliveryAddress as any)?.locationSource || (deliveryAddress?.id === 'current-location' ? 'CURRENT_GPS' : 'MANUAL_GEOCODED')"
);
content = content.replace(
  /selectedAddress\?.placeName \|\| selectedAddress\?.addressLine1/g,
  "deliveryAddress?.placeName || deliveryAddress?.addressLine1"
);
content = content.replace(
  /selectedAddress\?.city/g,
  "deliveryAddress?.city"
);
content = content.replace(
  /selectedAddress\?.state/g,
  "deliveryAddress?.state"
);
content = content.replace(
  /selectedAddress\?.postalCode/g,
  "deliveryAddress?.postalCode"
);
content = content.replace(
  /latitude: hasCoords \? selectedAddress!\.latitude! : undefined/g,
  "latitude: hasCoords ? deliveryAddress!.latitude! : undefined"
);
content = content.replace(
  /longitude: hasCoords \? selectedAddress!\.longitude! : undefined/g,
  "longitude: hasCoords ? deliveryAddress!.longitude! : undefined"
);
content = content.replace(
  /customerState: selectedAddress\?\.state \|\| 'J&K'/g,
  "customerState: deliveryAddress?.state || 'J&K'"
);

// 5. Update refreshQuote dependency array
content = content.replace(
  /refreshQuote = useCallback\(\(\) => \{[\s\S]*?\}, \[items, selectedAddress, tipAmount\]\)/g,
  (match) => match.replace("selectedAddress", "deliveryAddress")
);

// 6. Update order payload building
content = content.replace(
  /deliveryAddressId: selectedAddress\.id !== 'current-location' \? selectedAddress\.id : undefined,/g,
  "deliveryAddressId: deliveryAddress.id !== 'current-location' ? deliveryAddress.id : undefined,"
);
content = content.replace(
  /deliveryAddress: \{[\s\S]*?\},/g,
  (match) => match.replace(/selectedAddress/g, "deliveryAddress")
);

// 7. Update UI sections
// Section 1: CURRENT LOCATION
content = content.replace(
  /\{selectedAddress\?.label \|\| 'CURRENT DELIVERY ADDRESS'\}/g,
  "{currentLocation?.label || 'CURRENT LOCATION'}"
);
content = content.replace(
  /\{selectedAddress \? `\$\{selectedAddress\.addressLine1\}, \$\{selectedAddress\.city\}` : 'No address selected'\}/g,
  "{currentLocation ? `${currentLocation.addressLine1}, ${currentLocation.city}` : 'No address selected'}"
);

// Section 5: DELIVERY ADDRESS
content = content.replace(
  /\{selectedAddress \? `\$\{selectedAddress\.addressLine1\}\$\{selectedAddress\.addressLine2 \? `, \$\{selectedAddress\.addressLine2\}` : ''\}, \$\{selectedAddress\.city\} - \$\{selectedAddress\.postalCode\}` : 'No address selected'\}/g,
  "{deliveryAddress ? `${deliveryAddress.addressLine1}${deliveryAddress.addressLine2 ? `, ${deliveryAddress.addressLine2}` : ''}, ${deliveryAddress.city} - ${deliveryAddress.postalCode}` : 'No address selected'}"
);

// Address Modal Updates
content = content.replace(
  /setSelectedAddress\(addr\.id\);\s+setShowCustomAddressModal\(false\);/g,
  "setDeliveryAddress(addr.id);\n                            setShowCustomAddressModal(false);"
);
content = content.replace(
  /selectedAddress\?.id === addr\.id \? 'border-orange-500 bg-orange-50' : 'border-gray-200 hover:bg-gray-50'/g,
  "deliveryAddress?.id === addr.id ? 'border-orange-500 bg-orange-50' : 'border-gray-200 hover:bg-gray-50'"
);
content = content.replace(
  /disabled=\{isPlacing \|\| !selectedAddress \|\| Boolean/g,
  "disabled={isPlacing || !deliveryAddress || Boolean"
);
content = content.replace(
  /!selectedAddress \s*\?\s*'SELECT ADDRESS'/g,
  "!deliveryAddress ? 'SELECT ADDRESS'"
);

// Manual Address Saving - Make sure addAddress receives 'true'
content = content.replace(
  /addAddress\(newAddr\);/g,
  "addAddress(newAddr, true);"
);

// Finally, replace corrupted rupee symbols with formatCurrency
// Note: Some places have template literal strings or JSX text
content = content.replace(/₹\{([^\}]+)\}/g, "{formatCurrency($1)}");
content = content.replace(/â‚¹\{([^\}]+)\}/g, "{formatCurrency($1)}");
content = content.replace(/,1\{([^\}]+)\}/g, "{formatCurrency($1)}");
content = content.replace(/₹([0-9\.]+)/g, "{formatCurrency($1)}");
content = content.replace(/â‚¹([0-9\.]+)/g, "{formatCurrency($1)}");
content = content.replace(/,1([0-9\.]+)/g, "{formatCurrency($1)}");

// Specific edge cases for JSX bindings
content = content.replace(/>₹</g, ">{formatCurrency(");
content = content.replace(/>\+₹\{tipAmount\}</g, ">+{formatCurrency(tipAmount)}<");


fs.writeFileSync(checkoutPath, content, 'utf8');
console.log("Patched checkout logic successfully!");
