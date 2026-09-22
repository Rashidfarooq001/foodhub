const fs = require('fs');
const glob = require('glob');
const path = require('path');

// Replace all occurrences in the workspace
const files = [
  'apps/customer-web/src/hooks/useMapplsSdk.ts',
  'apps/delivery-dashboard/src/components/navigation/DeliveryMap.tsx',
  'apps/hotel-dashboard/src/components/map/GoogleMapPicker.tsx',
  // maybe others?
];

files.forEach(file => {
  const p = path.join(__dirname, file);
  if (fs.existsSync(p)) {
    let content = fs.readFileSync(p, 'utf8');
    
    // Replace the main SDK script
    content = content.replace(
      /https:\/\/sdk\.mappls\.com\/map\/sdk\/web\?v=3\.0&access_token=\$\{([^}]+)\}/g,
      'https://apis.mappls.com/advancedmaps/api/${$1}/map_sdk?layer=vector&v=3.0'
    );
    
    // Replace the plugins script if it exists
    content = content.replace(
      /https:\/\/sdk\.mappls\.com\/map\/sdk\/plugins\?v=3\.0&access_token=\$\{([^}]+)\}(&libraries=[^`]+)/g,
      'https://apis.mappls.com/advancedmaps/api/${$1}/map_sdk_plugins?v=3.0$2'
    );
    
    fs.writeFileSync(p, content, 'utf8');
    console.log('Updated', file);
  }
});
