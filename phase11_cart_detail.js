const https = require('https');

// The checkout page chunk 3-n7qypmik7zb.js has BOTH the cart page and checkout page code
// Let me find the cart section specifically - search for "Item Subtotal" which is the cart's label
https.get({
  hostname: 'foodhub-customer-web-ten.vercel.app',
  path: '/_next/static/chunks/3-n7qypmik7zb.js',
  headers: { 'User-Agent': 'Mozilla/5.0' }
}, res => {
  let js = '';
  res.on('data', c => js += c.toString());
  res.on('end', () => {
    // Find "Item Subtotal" - this is the cart page label
    let idx = js.indexOf('Item Subtotal');
    if (idx > -1) {
      console.log('=== CART PAGE CODE (Item Subtotal section) ===');
      console.log(js.substring(Math.max(0, idx - 300), idx + 600));
    }

    // Also find "Bill Summary" 
    idx = js.indexOf('Bill Summary');
    if (idx > -1) {
      console.log('\n=== Bill Summary section ===');
      console.log(js.substring(Math.max(0, idx - 100), idx + 600));
    }
    
    // Find "To Pay" which is the cart total label
    idx = js.indexOf('To Pay');
    if (idx > -1) {
      console.log('\n=== To Pay section ===');
      console.log(js.substring(Math.max(0, idx - 300), idx + 100));
    }
  });
});
