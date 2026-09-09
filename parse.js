const fs = require('fs');
const data = JSON.parse(fs.readFileSync('./report.json', 'utf8'));
const network = data.audits['network-requests']?.details?.items || [];
console.log('Top requests by size:');
network.sort((a, b) => b.transferSize - a.transferSize).slice(0, 5).forEach(i => console.log(i.url, (i.transferSize/1024).toFixed(1) + ' KB'));
console.log('LCP:', data.audits['largest-contentful-paint'].displayValue);
