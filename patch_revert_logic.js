const fs = require('fs');
const checkoutPath = 'apps/customer-web/src/app/checkout/page.tsx';
let content = fs.readFileSync(checkoutPath, 'utf8');

content = content.replace(/getDeliveryAddress/g, "getSelectedAddress");
content = content.replace(/setDeliveryAddress/g, "setSelectedAddress");
content = content.replace(/deliveryAddress/g, "selectedAddress");

// Fix the destructuring that might have duplicates now
content = content.replace(/const \{ addresses, selectedAddressId, setSelectedAddress, getSelectedAddress, addAddress, getSelectedAddress, setSelectedAddress \} = useAddressStore\(\);/g, "const { addresses, selectedAddressId, setSelectedAddress, getSelectedAddress, addAddress } = useAddressStore();");

fs.writeFileSync(checkoutPath, content, 'utf8');
