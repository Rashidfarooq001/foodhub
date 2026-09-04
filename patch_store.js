const fs = require('fs');
const storePath = 'apps/customer-web/src/stores/use-address-store.ts';
let content = fs.readFileSync(storePath, 'utf8');

// Replace getDeliveryAddress logic
content = content.replace(
  /getDeliveryAddress: \(\) => \{\s+const \{ addresses, deliveryAddressId, selectedAddressId \} = get\(\);\s+const targetId = deliveryAddressId \|\| selectedAddressId;\s+if \(!targetId\) return addresses\[0\] \|\| null;\s+return addresses\.find\(\(a\) => a\.id === targetId\) \|\| addresses\[0\] \|\| null;\s+\},/m,
  `getDeliveryAddress: () => {
        const { addresses, deliveryAddressId } = get();
        if (deliveryAddressId) {
          const found = addresses.find((a) => a.id === deliveryAddressId);
          if (found) return found;
        }
        
        // Find a default saved delivery address, excluding current-location
        const savedAddresses = addresses.filter(a => a.id !== 'current-location' && a.label !== 'Current Location');
        if (savedAddresses.length > 0) {
          return savedAddresses.find((a) => a.isDefault) || savedAddresses[0];
        }
        return null;
      },`
);

fs.writeFileSync(storePath, content, 'utf8');
