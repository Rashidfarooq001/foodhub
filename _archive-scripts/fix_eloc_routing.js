const fs = require('fs');
let code = fs.readFileSync('apps/backend/src/modules/geolocation/geolocation.service.ts', 'utf8');

const regex =
  /const elocUrl = `https:\/\/explore\.mappls\.com[\s\S]*?finalElocResponse = outpostResponse;\s*\}[\s\S]*?if \(finalElocResponse\.ok\) \{[\s\S]*?const elocData = await finalElocResponse\.json\(\);[\s\S]*?const elocLat = parseFloat\(elocData\?\.latitude \?\? elocData\?\.lat\);[\s\S]*?const elocLng = parseFloat\(elocData\?\.longitude \?\? elocData\?\.lng\);[\s\S]*?if \(\!isNaN\(elocLat\) && \!isNaN\(elocLng\)\) \{[\s\S]*?finalLat = elocLat;[\s\S]*?finalLng = elocLng;[\s\S]*?\}[\s\S]*?\}/;

const replacement = `// Use Mappls Routing API (which works with REST keys) to extract coordinates for the eLoc!
          const routeExtractUrl = \`https://route.mappls.com/route/direction/route_adv/driving/\${firstResult.eLoc};\${firstResult.eLoc}?access_token=\${encodeURIComponent(token)}\`;
          const elocController = new AbortController();
          const elocTimeout = setTimeout(() => elocController.abort(), 8000);
          
          const elocHeaders = { 'Accept': 'application/json' };
          if (token.startsWith('ey')) { elocHeaders['Authorization'] = \`Bearer \${token}\`; }
          
          const routeResponse = await fetch(routeExtractUrl, { headers: elocHeaders, signal: elocController.signal });
          clearTimeout(elocTimeout);
          elocDebugStatus = routeResponse.status;
          elocDebugUrl = routeExtractUrl;

          if (routeResponse.ok) {
            const routeData = await routeResponse.json();
            if (routeData?.waypoints && routeData.waypoints.length > 0) {
              const location = routeData.waypoints[0].location; // [lng, lat]
              if (location && location.length === 2) {
                finalLng = parseFloat(location[0]);
                finalLat = parseFloat(location[1]);
              }
            }
          }`;

code = code.replace(regex, replacement);

fs.writeFileSync('apps/backend/src/modules/geolocation/geolocation.service.ts', code);
console.log('Modified to use routing API for coordinates');
