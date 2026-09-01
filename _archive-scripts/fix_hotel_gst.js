const fs = require('fs');
let code = fs.readFileSync('apps/hotel-dashboard/src/app/page.tsx', 'utf8');

// Add state for gstRate
code = code.replace(
  'const [statsLoading, setStatsLoading] = useState(true);',
  'const [statsLoading, setStatsLoading] = useState(true);\n  const [gstRate, setGstRate] = useState(5);',
);

// Fetch it
code = code.replace(
  'const [statsRes, ordersRes] = await Promise.all([',
  `const [statsRes, ordersRes, configRes] = await Promise.all([\n          fetch(\`\${API_BASE}/analytics/restaurant\`, {
            headers: { Authorization: \`Bearer \${accessToken}\` },
          }),\n          fetch(\`\${API_BASE}/orders?status=PENDING,ACCEPTED,PREPARING,READY_FOR_PICKUP\`, {
            headers: { Authorization: \`Bearer \${accessToken}\` },
          }),\n          fetch(\`\${API_BASE}/pricing/config\`)`,
);

code = code.replace(
  'if (statsRes.ok) {',
  `if (configRes && configRes.ok) {\n            const configData = await configRes.json();\n            if (configData.foodGstRate) setGstRate(configData.foodGstRate);\n          }\n          if (statsRes.ok) {`,
);

// Replace the hardcoded Math.round(kpi.todayRevenue * 0.05)
code = code.replace(/Sec 9\(5\) GST \(5%\)/g, 'Sec 9(5) GST ({gstRate}%)');

code = code.replace(
  /Math.round\(kpi.todayRevenue \* 0\.05\)/g,
  'Math.round(kpi.todayRevenue * (gstRate / 100))',
);

fs.writeFileSync('apps/hotel-dashboard/src/app/page.tsx', code);
console.log('Fixed GST in hotel-dashboard page.tsx');
