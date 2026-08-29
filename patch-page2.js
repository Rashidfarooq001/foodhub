const fs = require('fs');
const file = 'apps/customer-web/src/app/orders/[id]/track/page.tsx';
let content = fs.readFileSync(file, 'utf8');

const oldParse = `        if (typeof trackData?.etaMins === 'number') {
          setServerEtaMins(trackData.etaMins);
        }`;

const newParse = `        if (typeof trackData?.etaMins === 'number') {
          setServerEtaMins(trackData.etaMins);
        }
        if (typeof trackData?.distanceKm === 'number') {
          setDistanceKm(trackData.distanceKm);
        }
        setLastUpdate(new Date());`;

content = content.replace(oldParse, newParse);
fs.writeFileSync(file, content, 'utf8');
console.log("Patched trackData parser");
