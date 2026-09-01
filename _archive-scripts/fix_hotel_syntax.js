const fs = require('fs');
let code = fs.readFileSync('apps/hotel-dashboard/src/app/page.tsx', 'utf8');

code = code.replace(
  'fetch(`${API_BASE}/pricing/config`)\n          fetch(`${API_BASE}/analytics/restaurant`, {',
  'fetch(`${API_BASE}/pricing/config`),\n          fetch(`${API_BASE}/analytics/restaurant`, {',
);

code = code.replace(
  'const [statsRes, activeOrdersRes, recentOrdersRes] = await Promise.all([',
  'const [configRes, statsRes, activeOrdersRes, recentOrdersRes] = await Promise.all([',
);

fs.writeFileSync('apps/hotel-dashboard/src/app/page.tsx', code, 'utf8');
console.log('Fixed hotel-dashboard syntax error');
