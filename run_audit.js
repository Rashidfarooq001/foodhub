const { execSync } = require('child_process');
const fs = require('fs');
const urls = [
  { url: 'http://localhost:3000/', app: 'Customer', page: 'Home' },
  { url: 'http://localhost:3001/login', app: 'Hotel', page: 'Login' },
  { url: 'http://localhost:3002/login', app: 'Delivery', page: 'Login' },
  { url: 'http://localhost:3003/login', app: 'Admin', page: 'Login' },
];
let md = '| App | Page | Performance | LCP | FCP | TBT | CLS | Main Problems |\\n|---|---|---|---|---|---|---|---|\\n';
for (let { url, app, page } of urls) {
  try {
    console.log('Auditing ' + app + '...');
    execSync('npx lighthouse ' + url + ' --output json --output-path ./report.json --chrome-flags=\"--headless\"', { stdio: 'ignore' });
    const data = JSON.parse(fs.readFileSync('./report.json', 'utf8'));
    const perf = Math.round(data.categories.performance?.score * 100);
    const lcp = data.audits['largest-contentful-paint']?.displayValue;
    const fcp = data.audits['first-contentful-paint']?.displayValue;
    const tbt = data.audits['total-blocking-time']?.displayValue;
    const cls = data.audits['cumulative-layout-shift']?.displayValue;
    md += '| ' + app + ' | ' + page + ' | ' + perf + ' | ' + lcp + ' | ' + fcp + ' | ' + tbt + ' | ' + cls + ' | Pending analysis |\\n';
  } catch (e) {
    console.error('Error on ' + app + ': ' + e.message);
  }
}
fs.writeFileSync('C:/Users/RASHID FAROOQ/.gemini/antigravity/brain/5844cbfc-a16d-48d9-a8cd-2ec745504c4e/baseline.md', md);
console.log('Done.');
