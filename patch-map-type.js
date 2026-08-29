const fs = require('fs');
const file = 'apps/customer-web/src/components/tracking/LiveTrackingMap.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  'bounds.push([Number(coord.lat), Number(coord.lng)]);',
  'bounds.push([Number((coord as any).lat), Number((coord as any).lng)]);'
);

fs.writeFileSync(file, content, 'utf8');
console.log("Patched LiveTrackingMap type error");
