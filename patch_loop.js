const fs = require('fs');
const pagePath = 'apps/customer-web/src/app/page.tsx';
let content = fs.readFileSync(pagePath, 'utf8');

content = content.replace(/setUserCoords\(coords\);/g, `setUserCoords(prev => {
            if (prev && prev.lat === coords.lat && prev.lng === coords.lng) return prev;
            return coords;
          });`);

fs.writeFileSync(pagePath, content, 'utf8');
