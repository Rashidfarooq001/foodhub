const fs = require('fs');
let code = fs.readFileSync('apps/backend/src/modules/geolocation/geolocation.service.ts', 'utf8');

const regex =
  /if \(isNaN\(finalLat\) \|\| isNaN\(finalLng\)\) \{[\s\S]*?return this\._fallbackGeocodeFailure\('Mappls returned invalid coordinates\. ' \+ \(firstResult\.eLoc \? 'Failed to resolve eLoc\.' : ''\)\);[\s\S]*?\}/;

const replacement = `if (isNaN(finalLat) || isNaN(finalLng)) {
        return {
          success: false,
          debugData: { elocStatus: elocResponse?.status, elocUrl: elocUrl, firstResult: firstResult },
          reason: 'Mappls returned invalid coordinates. ' + (firstResult.eLoc ? 'Failed to resolve eLoc.' : '')
        } as any;
      }`;

code = code.replace(regex, replacement);

fs.writeFileSync('apps/backend/src/modules/geolocation/geolocation.service.ts', code);
console.log('Modified debug');
