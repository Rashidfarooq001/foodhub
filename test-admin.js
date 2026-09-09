const { execSync } = require('child_process');
const fs = require('fs');
execSync('npx lighthouse http://localhost:3003/login --output json --output-path ./report-admin-after.json --chrome-flags=\"--headless\"', { stdio: 'ignore' });
const data = JSON.parse(fs.readFileSync('./report-admin-after.json', 'utf8'));
const perf = Math.round(data.categories.performance?.score * 100);
const lcp = data.audits['largest-contentful-paint']?.displayValue;
const fcp = data.audits['first-contentful-paint']?.displayValue;
console.log('Perf:', perf, 'LCP:', lcp, 'FCP:', fcp);
