const fs = require('fs');
let code = fs.readFileSync('apps/backend/src/modules/geolocation/geolocation.service.ts', 'utf8');

const regex =
  /if \(isNaN\(lat\) \|\| isNaN\(lng\)\) \{[\s\S]*?return \{[\s\S]*?success: false,[\s\S]*?debugData: data,[\s\S]*?debugFirstResult: firstResult,[\s\S]*?reason: 'Mappls returned invalid coordinates'[\s\S]*?\} as any;\s*\}/;

const replacement = `
      let finalLat = lat;
      let finalLng = lng;

      // If Geocode API only returns eLoc (common in Mappls REST Geocoding without coordinate entitlements), resolve it
      if ((isNaN(finalLat) || isNaN(finalLng)) && firstResult.eLoc) {
        try {
          const elocUrl = \`https://explore.mappls.com/api/places/eloc?eloc=\${firstResult.eLoc}&access_token=\${token}\`;
          const elocController = new AbortController();
          const elocTimeout = setTimeout(() => elocController.abort(), 8000);
          const elocResponse = await fetch(elocUrl, { signal: elocController.signal });
          clearTimeout(elocTimeout);
          if (elocResponse.ok) {
            const elocData = await elocResponse.json();
            const elocLat = parseFloat(elocData?.latitude ?? elocData?.lat);
            const elocLng = parseFloat(elocData?.longitude ?? elocData?.lng);
            if (!isNaN(elocLat) && !isNaN(elocLng)) {
              finalLat = elocLat;
              finalLng = elocLng;
            }
          }
        } catch (e) {
          this.logger.warn('Failed to resolve eLoc: ' + e.message);
        }
      }

      if (isNaN(finalLat) || isNaN(finalLng)) {
        return this._fallbackGeocodeFailure('Mappls returned invalid coordinates. ' + (firstResult.eLoc ? 'Failed to resolve eLoc.' : ''));
      }
      
      const latResolved = finalLat;
      const lngResolved = finalLng;
`;

code = code.replace(regex, replacement);

// Only replace inside geocodeAddress function
const geocodeAddressStart = code.indexOf('async geocodeAddress(');
const nextFunc = code.indexOf('async geocodeStructuredAddress(');

let chunk = code.substring(geocodeAddressStart, nextFunc);
chunk = chunk.replace(/latitude: lat,/g, 'latitude: latResolved,');
chunk = chunk.replace(/longitude: lng,/g, 'longitude: lngResolved,');

code = code.substring(0, geocodeAddressStart) + chunk + code.substring(nextFunc);

fs.writeFileSync('apps/backend/src/modules/geolocation/geolocation.service.ts', code);
console.log('Modified with eLoc fallback safely');
