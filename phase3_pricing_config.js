const https = require('https');
https.get('https://foodhub-backend-enq2.onrender.com/api/v1/pricing/config', res => {
  let d = '';
  res.on('data', c => d += c);
  res.on('end', () => {
    const j = JSON.parse(d);
    console.log('=== LIVE PRICING CONFIG ===');
    console.log('foodGstRate:', j.foodGstRate);
    console.log('platformFee:', j.platformFee);
    console.log('deliveryFeeBaseAmount:', j.deliveryFeeBaseAmount);
    console.log('Full config:', JSON.stringify(j, null, 2));
  });
});
