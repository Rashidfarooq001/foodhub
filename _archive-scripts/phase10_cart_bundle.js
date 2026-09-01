const https = require('https');

// Check the cart page bundle too
https.get(
  {
    hostname: 'foodhub-customer-web-ten.vercel.app',
    path: '/cart',
    headers: { 'User-Agent': 'Mozilla/5.0' },
  },
  (res) => {
    let html = '';
    res.on('data', (c) => (html += c.toString()));
    res.on('end', () => {
      const scripts = [...html.matchAll(/src="([^"]*_next[^"]*)"/g)].map((m) => m[1]);
      console.log('Cart page scripts:', scripts.length);

      // The checkout chunk already has the cart code in it based on our scan.
      // Let me check the other chunk (0yjrphyvq5c5p) which had totalCustomerTaxes too
      https.get(
        {
          hostname: 'foodhub-customer-web-ten.vercel.app',
          path: '/_next/static/chunks/0yjrphyvq5c5p.js',
          headers: { 'User-Agent': 'Mozilla/5.0' },
        },
        (res2) => {
          let js = '';
          res2.on('data', (c) => (js += c.toString()));
          res2.on('end', () => {
            console.log('\n=== Cart Sidebar/Drawer Bundle (0yjrphyvq5c5p) ===');

            // Find Platform Fee
            let idx = js.indexOf('Platform Fee');
            if (idx > -1) {
              console.log('\nPlatform Fee context:');
              console.log(js.substring(Math.max(0, idx - 200), idx + 200));
            }

            // Find Item Subtotal
            idx = js.indexOf('Item Subtotal');
            if (idx > -1) {
              console.log('\nItem Subtotal context:');
              console.log(js.substring(Math.max(0, idx - 100), idx + 300));
            }

            // Find "₹3" or ₹0
            idx = 0;
            let count = 0;
            while ((idx = js.indexOf('\u20B90', idx)) !== -1) {
              count++;
              console.log(`\n₹0 at ${idx}:`, js.substring(Math.max(0, idx - 150), idx + 50));
              idx += 2;
            }
            console.log('\nTotal ₹0:', count);

            idx = 0;
            count = 0;
            while ((idx = js.indexOf('||3', idx)) !== -1) {
              count++;
              console.log(`\n||3 at ${idx}:`, js.substring(Math.max(0, idx - 100), idx + 50));
              idx += 3;
            }
            console.log('\nTotal ||3:', count);
          });
        },
      );
    });
  },
);
