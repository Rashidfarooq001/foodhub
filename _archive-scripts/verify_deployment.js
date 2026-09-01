const https = require('https');

// Step 1: Fetch the checkout page to get the current script URLs
https.get(
  {
    hostname: 'foodhub-customer-web-ten.vercel.app',
    path: '/checkout',
    headers: { 'User-Agent': 'Mozilla/5.0', 'Cache-Control': 'no-cache' },
  },
  (res) => {
    let html = '';
    res.on('data', (c) => (html += c.toString()));
    res.on('end', () => {
      console.log('=== VERCEL RESPONSE HEADERS ===');
      console.log('x-vercel-cache:', res.headers['x-vercel-cache']);
      console.log('x-vercel-id:', res.headers['x-vercel-id']);
      console.log('age:', res.headers['age']);
      console.log('etag:', res.headers['etag']);

      const scripts = [...html.matchAll(/src="([^"]*_next[^"]*)"/g)].map((m) => m[1]);
      console.log('\nTotal scripts:', scripts.length);
      scripts.forEach((s) => console.log(' ', s));

      // Check if chunk names changed (new deployment = new chunk hashes)
      const oldChunks = ['3-n7qypmik7zb', '21t4mpmwqr7ai'];
      const hasOldChunks = oldChunks.some((c) => scripts.some((s) => s.includes(c)));
      console.log('\nOLD chunk hashes still present:', hasOldChunks);

      if (!hasOldChunks) {
        console.log('NEW DEPLOYMENT DETECTED! Chunk hashes have changed.');
      }

      // Now scan ALL non-framework chunks for GST hardcoded values
      const appChunks = scripts.filter((s) => !s.includes('turbopack'));
      let scanned = 0;
      let totalChunks = appChunks.length;

      appChunks.forEach((chunkPath) => {
        https
          .get(
            {
              hostname: 'foodhub-customer-web-ten.vercel.app',
              path: chunkPath,
              headers: { 'User-Agent': 'Mozilla/5.0' },
            },
            (res2) => {
              let js = '';
              res2.on('data', (c) => (js += c.toString()));
              res2.on('end', () => {
                scanned++;
                const chunkName = chunkPath.split('/').pop();

                if (
                  js.includes('GST') ||
                  js.includes('totalCustomerTaxes') ||
                  js.includes('Platform Fee')
                ) {
                  console.log(`\n=== ${chunkName} ===`);

                  // Check for hardcoded ₹0
                  if (js.includes('\u20B90')) {
                    const idx = js.indexOf('\u20B90');
                    console.log('  ❌ FOUND hardcoded ₹0');
                    console.log('  Context:', js.substring(Math.max(0, idx - 150), idx + 50));
                  } else {
                    console.log('  ✅ No hardcoded ₹0');
                  }

                  // Check for hardcoded ₹3
                  if (js.includes('children:"₹3"') || js.includes("children:'₹3'")) {
                    console.log('  ❌ FOUND hardcoded ₹3');
                  } else {
                    console.log('  ✅ No hardcoded ₹3');
                  }

                  // Check for ||3 fallback
                  if (js.includes('||3')) {
                    const idx = js.indexOf('||3');
                    console.log('  ⚠️ Found ||3 fallback:');
                    console.log('  ', js.substring(Math.max(0, idx - 80), idx + 30));
                  }

                  // Check for totalCustomerTaxes usage
                  if (js.includes('totalCustomerTaxes')) {
                    const idx = js.indexOf('totalCustomerTaxes');
                    console.log('  📍 totalCustomerTaxes context:');
                    console.log('  ', js.substring(Math.max(0, idx - 80), idx + 120));
                  }

                  // Check for GST & Taxes rendering
                  const gstIdx = js.indexOf('GST');
                  if (gstIdx > -1) {
                    console.log('  📍 GST context:');
                    console.log('  ', js.substring(Math.max(0, gstIdx - 80), gstIdx + 200));
                  }
                }

                if (scanned === totalChunks) {
                  console.log('\n\n=== SCAN COMPLETE ===');
                }
              });
            },
          )
          .on('error', () => {
            scanned++;
          });
      });
    });
  },
);
