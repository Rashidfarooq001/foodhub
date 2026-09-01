const fs = require('fs');
const path = 'apps/customer-web/src/app/orders/[id]/track/page.tsx';
let content = fs.readFileSync(path, 'utf8');

// 1. Update lastUpdate when location is received
content = content.replace(
  /setDriverLoc\(\{\s*lat:\s*data.lat,\s*lng:\s*data.lng\s*\}\);/g,
  `setDriverLoc({ lat: data.lat, lng: data.lng });\n          setLastUpdate(new Date());`,
);
content = content.replace(
  /setDriverLoc\(\{\s*lat:\s*trackData.driverLat,\s*lng:\s*trackData.driverLng\s*\}\);/g,
  `setDriverLoc({ lat: trackData.driverLat, lng: trackData.driverLng });\n            if (trackData.updatedAt) setLastUpdate(new Date(trackData.updatedAt));\n            else setLastUpdate(new Date());`,
);

// 2. Change the Live Socket Connected text to reflect stale status
const socketTextRegex =
  /<span className=\{\`h-2 w-2 rounded-full \$\{\s*isSocketConnected \? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'\s*\}\`\} \/>\s*\{isSocketConnected \? 'Live Socket Connected' : 'Auto Syncing \(5s\)'\}/;

const newSocketText = `<span className={\`h-2 w-2 rounded-full \${!isSocketConnected ? 'bg-amber-500 animate-pulse' : timeAgoStr === 'LIVE' ? 'bg-emerald-500' : 'bg-amber-500'}\`} />
              {!isSocketConnected ? 'Reconnecting...' : timeAgoStr === 'LIVE' ? 'Live Socket Connected' : 'Rider location updating...'}`;

content = content.replace(socketTextRegex, newSocketText);

fs.writeFileSync(path, content, 'utf8');
