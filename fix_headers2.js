const fs = require('fs');
let code = fs.readFileSync('apps/backend/src/modules/geolocation/geolocation.service.ts', 'utf8');

const regex = /const elocUrl = `https:\/\/explore\.mappls\.com\/api\/places\/eloc\?eloc=\$\{firstResult\.eLoc\}&access_token=\$\{token\}`;[\s\S]*?const elocResponse = await fetch\(elocUrl, \{ signal: elocController\.signal \}\);/;

const replacement = `const elocUrl = \`https://explore.mappls.com/api/places/eloc?eloc=\${firstResult.eLoc}&access_token=\${token}\`;
          const elocController = new AbortController();
          const elocTimeout = setTimeout(() => elocController.abort(), 8000);
          
          const isJwt = token.startsWith('ey');
          const elocHeaders = { 'Accept': 'application/json' };
          if (isJwt) { elocHeaders['Authorization'] = \`Bearer \${token}\`; }
          
          const elocResponse = await fetch(elocUrl, { headers: elocHeaders, signal: elocController.signal });`;

code = code.replace(regex, replacement);
fs.writeFileSync('apps/backend/src/modules/geolocation/geolocation.service.ts', code);
console.log('Modified');
