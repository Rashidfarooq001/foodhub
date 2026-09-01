const https = require('https');

// Fetch the checkout chunk and extract the full GST rendering context
https.get(
  {
    hostname: 'foodhub-customer-web-ten.vercel.app',
    path: '/_next/static/chunks/3-n7qypmik7zb.js',
    headers: { 'User-Agent': 'Mozilla/5.0' },
  },
  (res) => {
    let js = '';
    res.on('data', (c) => (js += c.toString()));
    res.on('end', () => {
      // Find ALL occurrences of "₹0"
      let idx = 0;
      let count = 0;
      while ((idx = js.indexOf('\u20B90', idx)) !== -1) {
        count++;
        console.log(`\n=== ₹0 occurrence #${count} at position ${idx} ===`);
        console.log(js.substring(Math.max(0, idx - 200), idx + 100));
        idx += 2;
      }
      console.log('\nTotal ₹0 occurrences:', count);

      // Find all "₹3" occurrences
      idx = 0;
      count = 0;
      while ((idx = js.indexOf('\u20B93', idx)) !== -1) {
        count++;
        console.log(`\n=== ₹3 occurrence #${count} at position ${idx} ===`);
        console.log(js.substring(Math.max(0, idx - 200), idx + 100));
        idx += 2;
      }
      console.log('\nTotal ₹3 occurrences:', count);

      // Find "Platform Fee" context
      idx = js.indexOf('Platform Fee');
      if (idx > -1) {
        console.log('\n=== Platform Fee context ===');
        console.log(js.substring(Math.max(0, idx - 100), idx + 300));
      }
    });
  },
);
