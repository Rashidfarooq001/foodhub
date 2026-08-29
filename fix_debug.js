const fs = require('fs');
let code = fs.readFileSync('apps/backend/src/modules/geolocation/geolocation.service.ts', 'utf8');

const regex = /if \(isNaN\(lat\) \|\| isNaN\(lng\)\) \{[\s\S]*?return this\._fallbackGeocodeFailure\('Mappls returned invalid coordinates'\);\s*\}/;
const replacement = `if (isNaN(lat) || isNaN(lng)) {
        return {
          success: false,
          debugData: data,
          debugFirstResult: firstResult,
          reason: 'Mappls returned invalid coordinates'
        } as any;
      }`;

code = code.replace(regex, replacement);
fs.writeFileSync('apps/backend/src/modules/geolocation/geolocation.service.ts', code);
console.log('Modified');
