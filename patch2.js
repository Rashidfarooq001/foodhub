const fs = require('fs');
const checkoutPath = 'apps/customer-web/src/app/checkout/page.tsx';
let content = fs.readFileSync(checkoutPath, 'utf8');

// Replace all remaining selectedAddress properties inside handlePlaceOrder (and related logic) with deliveryAddress
content = content.replace(/!selectedAddress/g, "!deliveryAddress");
content = content.replace(/selectedAddress\.city/g, "deliveryAddress.city");
content = content.replace(/selectedAddress\.state/g, "deliveryAddress.state");
content = content.replace(/selectedAddress\.addressLine2/g, "deliveryAddress.addressLine2");
content = content.replace(/selectedAddress\.label/g, "deliveryAddress.label");
content = content.replace(/selectedAddress\.addressLine1/g, "deliveryAddress.addressLine1");
content = content.replace(/selectedAddress\.landmark/g, "deliveryAddress.landmark");
content = content.replace(/selectedAddress\.postalCode/g, "deliveryAddress.postalCode");
content = content.replace(/selectedAddress\.latitude/g, "deliveryAddress.latitude");
content = content.replace(/selectedAddress\.longitude/g, "deliveryAddress.longitude");
content = content.replace(/\(selectedAddress as any\)\.locationSource/g, "(deliveryAddress as any).locationSource");

// Also fix setSelectedAddress to setDeliveryAddress inside the Custom Address Modal logic if it's there
content = content.replace(/setSelectedAddress\('current-location'\)/g, "setDeliveryAddress('current-location')");
content = content.replace(/setSelectedAddress\(newAddr\.id\)/g, "setDeliveryAddress(newAddr.id)");

fs.writeFileSync(checkoutPath, content, 'utf8');
