const fs = require('fs');
const path = require('path');

const files = [
  'apps/customer-web/src/hooks/useMapplsSdk.ts',
  'apps/delivery-dashboard/src/components/navigation/DeliveryMap.tsx',
  'apps/hotel-dashboard/src/components/map/GoogleMapPicker.tsx',
];

files.forEach(file => {
  const p = path.join(__dirname, file);
  if (fs.existsSync(p)) {
    let content = fs.readFileSync(p, 'utf8');
    
    // Original strings:
    // https://sdk.mappls.com/map/sdk/web?v=3.0&access_token=${mapKey}
    // https://sdk.mappls.com/map/sdk/plugins?v=3.0&access_token=${mapToken}&libraries=direction
    
    content = content.replace(
      /https:\/\/sdk\.mappls\.com\/map\/sdk\/web\?v=3\.0&access_token=\$\{([^}]+)\}/g,
      'https://apis.mappls.com/advancedmaps/api/${$1}/map_sdk?layer=vector&v=3.0'
    );
    
    content = content.replace(
      /https:\/\/sdk\.mappls\.com\/map\/sdk\/plugins\?v=3\.0&access_token=\$\{([^}]+)\}&libraries=([a-zA-Z,]+)/g,
      'https://apis.mappls.com/advancedmaps/api/${$1}/map_sdk_plugins?v=3.0&libraries=$2'
    );
    
    // Also fix the query selector in useMapplsSdk.ts
    content = content.replace(
      /script\[src\*="sdk\.mappls\.com\/map\/sdk\/web"\]/g,
      'script[src*="apis.mappls.com/advancedmaps/api"]'
    );
    
    fs.writeFileSync(p, content, 'utf8');
    console.log('Updated', file);
  }
});
