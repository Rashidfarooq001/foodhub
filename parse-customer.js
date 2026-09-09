const fs = require('fs');
const data = JSON.parse(fs.readFileSync('./report-customer.json', 'utf8'));
const network = data.audits['network-requests']?.details?.items || [];
console.log('Top requests by size:');
network.sort((a, b) => b.transferSize - a.transferSize).slice(0, 5).forEach(i => console.log(i.url, (i.transferSize/1024).toFixed(1) + ' KB'));
console.log('\nTop requests by endTime (slowest):');
network.sort((a, b) => b.endTime - a.endTime).slice(0, 5).forEach(i => console.log(i.url, i.endTime.toFixed(1) + 'ms'));
