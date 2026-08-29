const https = require('https');

// Fetch each JS chunk and search for GST-related code
const chunks = [
  '3z0o6g8tgcwqh', '0yjrphyvq5c5p', '2d4dizjowzgj4', 
  '13vrb70bwowk1', '3-n7qypmik7zb', '2ttfstcplwvay',
  '0cz1d0mv5g_q7', '3th38hfydmvo6'
];

let done = 0;
chunks.forEach(chunk => {
  const path = `/_next/static/chunks/${chunk}.js`;
  https.get({
    hostname: 'foodhub-customer-web-ten.vercel.app',
    path: path,
    headers: { 'User-Agent': 'Mozilla/5.0' }
  }, res => {
    let js = '';
    res.on('data', c => js += c.toString());
    res.on('end', () => {
      done++;
      const hasGst = js.includes('GST');
      const hasTaxes = js.includes('Taxes');
      const hasGSTTaxes = js.includes('GST & Taxes') || js.includes('GST \\u0026 Taxes') || js.includes('GST \\x26 Taxes');
      const hasTotalCustomerTaxes = js.includes('totalCustomerTaxes');
      const hasPlatformFee = js.includes('platformFee');
      const hasCheckout = js.includes('checkout') || js.includes('Checkout');
      const hasRupee0 = js.includes('\u20B90') || js.includes('\\u20B90') || js.includes('&#x20B9;0');
      
      if (hasGst || hasTotalCustomerTaxes || hasCheckout) {
        console.log(`\n=== ${chunk}.js ===`);
        console.log('  GST:', hasGst);
        console.log('  GST & Taxes:', hasGSTTaxes);
        console.log('  totalCustomerTaxes:', hasTotalCustomerTaxes);
        console.log('  platformFee:', hasPlatformFee);
        console.log('  Checkout:', hasCheckout);
        console.log('  ₹0 hardcoded:', hasRupee0);
        
        // Extract context around "GST" 
        if (hasGSTTaxes || hasTotalCustomerTaxes) {
          const idx = js.indexOf('totalCustomerTaxes');
          if (idx > -1) {
            console.log('  CONTEXT around totalCustomerTaxes:');
            console.log('  ', js.substring(Math.max(0, idx - 100), idx + 150));
          }
          
          // Search for "GST" in various forms
          const gstIdx = js.indexOf('GST');
          if (gstIdx > -1) {
            console.log('  CONTEXT around GST:');
            console.log('  ', js.substring(Math.max(0, gstIdx - 100), gstIdx + 200));
          }
        }
      }
      
      if (done === chunks.length) console.log('\n\nScan complete.');
    });
  }).on('error', e => {
    done++;
    console.log(`${chunk} error:`, e.message);
  });
});
