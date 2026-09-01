const fs = require('fs');
let code = fs.readFileSync('apps/backend/src/modules/geolocation/geolocation.service.ts', 'utf8');

const regex =
  /const elocResponse = await fetch\(elocUrl, \{ headers: elocHeaders, signal: elocController\.signal \}\);[\s\S]*?if \(elocResponse\.ok\) \{[\s\S]*?const elocData = await elocResponse\.json\(\);/;

const replacement = `const elocResponse = await fetch(elocUrl, { headers: elocHeaders, signal: elocController.signal });
          elocDebugStatus = elocResponse.status;
          
          let finalElocResponse = elocResponse;
          if (!elocResponse.ok) {
            // fallback to outpost
            const outpostUrl = elocUrl.replace('explore', 'outpost');
            elocDebugUrl = outpostUrl;
            const outpostController = new AbortController();
            const outpostTimeout = setTimeout(() => outpostController.abort(), 8000);
            const outpostResponse = await fetch(outpostUrl, { headers: elocHeaders, signal: outpostController.signal });
            clearTimeout(outpostTimeout);
            elocDebugStatus = outpostResponse.status;
            finalElocResponse = outpostResponse;
          }

          if (finalElocResponse.ok) {
            const elocData = await finalElocResponse.json();`;

code = code.replace(regex, replacement);

fs.writeFileSync('apps/backend/src/modules/geolocation/geolocation.service.ts', code);
console.log('Modified fallback');
