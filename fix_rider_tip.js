const fs = require('fs');

const quoteFile = 'apps/backend/src/modules/tax/order-quote.service.ts';
let quoteContent = fs.readFileSync(quoteFile, 'utf8');

const lines = quoteContent.split('\n');

const filtered = [];
let skip = false;

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  
  if (line.includes('const riderTip = tipAmount; // 100% pass-through')) {
    // Check if we already have it in the recent lines
    const recent = filtered.slice(-10).join('\n');
    if (recent.includes('const riderTip = tipAmount;')) {
      skip = true; // start skipping this duplicate block
    } else {
      filtered.push(line);
      skip = false;
    }
  } else if (skip) {
    if (line.includes('const paymentGatewayCost =')) {
      skip = false;
      filtered.push(line);
    }
    // else skip
  } else {
    filtered.push(line);
  }
}

fs.writeFileSync(quoteFile, filtered.join('\n'));
console.log('Fixed riderTip duplicates');
