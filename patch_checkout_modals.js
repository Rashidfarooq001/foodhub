const fs = require('fs');
const checkoutPath = 'apps/customer-web/src/app/checkout/page.tsx';
let content = fs.readFileSync(checkoutPath, 'utf8');

// 1. Fix Destructuring
content = content.replace(
  /const \{ addresses, selectedAddressId, setSelectedAddress, getSelectedAddress, addAddress, getDeliveryAddress, setDeliveryAddress \} = useAddressStore\(\);/,
  "const { addresses, selectedAddressId, deliveryAddressId, setSelectedAddress, getSelectedAddress, addAddress, getDeliveryAddress, setDeliveryAddress } = useAddressStore();"
);

// 2. Add addressModalTarget state
content = content.replace(
  /const \[showCustomAddressModal, setShowCustomAddressModal\] = useState\(false\);/,
  "const [showCustomAddressModal, setShowCustomAddressModal] = useState(false);\n  const [addressModalTarget, setAddressModalTarget] = useState<'CURRENT' | 'DELIVERY' | null>(null);"
);

// 3. Update CURRENT LOCATION CHANGE button
content = content.replace(
  /setAddressVerificationError\(null\);\s*setShowCustomAddressModal\(true\);\s*\}\}\s*className="text-\[10px\] font-black text-orange-600 uppercase tracking-wide px-3 py-1 bg-orange-50 rounded-lg hover:bg-orange-100 transition shrink-0"/m,
  "setAddressVerificationError(null);\n                  setAddressModalTarget('CURRENT');\n                  setShowCustomAddressModal(true);\n                }}\n                className=\"text-[10px] font-black text-orange-600 uppercase tracking-wide px-3 py-1 bg-orange-50 rounded-lg hover:bg-orange-100 transition shrink-0\""
);

// 4. Update DELIVERY ADDRESS CHANGE button
content = content.replace(
  /onClick=\{\(\) => setShowCustomAddressModal\(true\)\}\s*className="text-\[10px\] font-black text-orange-600 uppercase tracking-wide"/m,
  "onClick={() => {\n                    setManualAddress('');\n                    setMatchedAddressResult(null);\n                    setAddressVerificationError(null);\n                    setAddressModalTarget('DELIVERY');\n                    setShowCustomAddressModal(true);\n                 }}\n                 className=\"text-[10px] font-black text-orange-600 uppercase tracking-wide\""
);

// 5. Update handleUseCurrentLocation
content = content.replace(
  /addAddress\(gpsAddr, true\);\s*setDeliveryAddress\('current-location'\);\s*setShowCustomAddressModal\(false\);/m,
  "if (addressModalTarget === 'CURRENT') {\n          addAddress(gpsAddr);\n          setSelectedAddress('current-location');\n        } else {\n          addAddress(gpsAddr, true);\n          setDeliveryAddress('current-location');\n        }\n        setShowCustomAddressModal(false);"
);

// 6. Update handleVerifyManualAddress
content = content.replace(
  /addAddress\(newAddr as any, true\);\s*setDeliveryAddress\(newAddr\.id\);\s*setShowCustomAddressModal\(false\);/m,
  "if (addressModalTarget === 'CURRENT') {\n            addAddress(newAddr as any);\n            setSelectedAddress(newAddr.id);\n          } else {\n            addAddress(newAddr as any, true);\n            setDeliveryAddress(newAddr.id);\n          }\n          setShowCustomAddressModal(false);"
);

// 7. Update address list selection in modal
content = content.replace(
  /onClick=\{\(\) => \{\s*setDeliveryAddress\(addr\.id\);\s*setShowCustomAddressModal\(false\);\s*\}\}/m,
  "onClick={() => {\n                              if (addressModalTarget === 'CURRENT') {\n                                setSelectedAddress(addr.id);\n                              } else {\n                                setDeliveryAddress(addr.id);\n                              }\n                              setShowCustomAddressModal(false);\n                            }}"
);

// 8. Fix fetchMenu logic
content = content.replace(
  /if \(Array\.isArray\(menuData\) && menuData\.length > 0\) \{\s*\/\/ Find a category with items\s*let allItems: any\[\] = \[\];\s*menuData\.forEach\(cat => \{\s*if \(cat\.items && Array\.isArray\(cat\.items\)\) \{\s*allItems\.push\(\.\.\.cat\.items\);\s*\}\s*\}\);\s*\/\/ Try to filter recommended, else just take 3\s*let recs: any\[\] = allItems\.filter\(i => i\.isRecommended \|\| i\.isBestseller\);\s*if \(recs\.length === 0\) recs = allItems;\s*\/\/ Filter out what is already in cart\s*const cartIds = new Set\(items\.map\(i => i\.id\)\);\s*recs = recs\.filter\(i => !cartIds\.has\(i\.id\)\);\s*setRecommendedItems\(recs\.slice\(0, 3\)\);\s*\}/m,
  `if (Array.isArray(menuData) && menuData.length > 0) {
              let allItems = menuData;
              let recs = allItems.filter(i => i.isRecommended || i.isBestseller);
              if (recs.length === 0) recs = allItems;
              const cartIds = new Set(items.map(i => i.foodItemId || i.id));
              recs = recs.filter(i => !cartIds.has(i.id));
              setRecommendedItems(recs.slice(0, 3));
            }`
);


fs.writeFileSync(checkoutPath, content, 'utf8');
