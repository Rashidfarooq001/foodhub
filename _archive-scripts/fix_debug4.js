const fs = require('fs');
let code = fs.readFileSync('apps/backend/src/modules/geolocation/geolocation.service.ts', 'utf8');

const regex =
  /let finalLat = lat;[\s\S]*?let finalLng = lng;[\s\S]*?\/\/ If Geocode API only returns/;

const replacement = `let finalLat = lat;
      let finalLng = lng;
      let elocDebugStatus = 0;
      let elocDebugUrl = '';

      // If Geocode API only returns`;

code = code.replace(regex, replacement);

const regex2 = /const elocResponse = await fetch/;
const replacement2 = `elocDebugUrl = elocUrl;
          const elocResponse = await fetch`;
code = code.replace(regex2, replacement2);

const regex3 = /if \(elocResponse\.ok\)/;
const replacement3 = `elocDebugStatus = elocResponse.status;
          if (elocResponse.ok)`;
code = code.replace(regex3, replacement3);

const regex4 =
  /if \(isNaN\(finalLat\) \|\| isNaN\(finalLng\)\) \{[\s\S]*?return \{[\s\S]*?success: false,[\s\S]*?debugData: \{ elocStatus: elocResponse\?\.status, elocUrl: elocUrl, firstResult: firstResult \},[\s\S]*?reason: 'Mappls returned invalid coordinates\. ' \+ \(firstResult\.eLoc \? 'Failed to resolve eLoc\.' : ''\)[\s\S]*?\} as any;\s*\}/;

const replacement4 = `if (isNaN(finalLat) || isNaN(finalLng)) {
        return {
          success: false,
          debugData: { elocStatus: elocDebugStatus, elocUrl: elocDebugUrl, firstResult: firstResult },
          reason: 'Mappls returned invalid coordinates. ' + (firstResult.eLoc ? 'Failed to resolve eLoc.' : '')
        } as any;
      }`;

code = code.replace(regex4, replacement4);

fs.writeFileSync('apps/backend/src/modules/geolocation/geolocation.service.ts', code);
console.log('Modified debug 2');
