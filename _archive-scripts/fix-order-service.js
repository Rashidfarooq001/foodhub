const fs = require('fs');
const path = 'apps/backend/src/modules/orders/orders.service.ts';
let content = fs.readFileSync(path, 'utf8');

const oldCode = `roadDistanceKm = routeData.distanceKm;
        etaMins = routeData.etaMinutes;`;
const newCode = `roadDistanceKm = routeData.distanceKm;
        etaMins = routeData.etaMinutes;
        routeCoordinates = routeData.coordinates;`;

content = content.replace(oldCode, newCode);
fs.writeFileSync(path, content, 'utf8');
