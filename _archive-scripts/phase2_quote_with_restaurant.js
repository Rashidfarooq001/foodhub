const https = require('https');

// Step 1: Get a restaurant
https.get('https://foodhub-backend-enq2.onrender.com/api/v1/restaurants', (res) => {
  let d = '';
  res.on('data', (c) => (d += c));
  res.on('end', () => {
    const restaurants = JSON.parse(d);
    const r = restaurants[0];
    console.log('Restaurant:', r.name, 'ID:', r.id);
    console.log('Restaurant lat/lng:', r.latitude, r.longitude);

    // Step 2: Quote with restaurant ID and nearby coords
    const lat = r.latitude + 0.005;
    const lng = r.longitude + 0.005;

    const body = JSON.stringify({
      restaurantId: r.id,
      foodSubtotal: 150,
      latitude: lat,
      longitude: lng,
      locationSource: 'MANUAL_GEOCODED',
      tipAmount: 0,
      discountAmount: 0,
      customerState: 'J&K',
      restaurantState: 'J&K',
    });

    const req = https.request(
      {
        hostname: 'foodhub-backend-enq2.onrender.com',
        port: 443,
        path: '/api/v1/orders/quote',
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) },
      },
      (res2) => {
        let data = '';
        res2.on('data', (c) => (data += c));
        res2.on('end', () => {
          console.log('\nHTTP STATUS:', res2.statusCode);
          console.log('\n=== RAW COMPLETE JSON ===');
          console.log(data);

          const j = JSON.parse(data);
          console.log('\n=== KEY FIELDS ===');
          console.log('foodSubtotal:', j.foodSubtotal);
          console.log('customerDeliveryFee:', j.customerDeliveryFee);
          console.log('platformFee:', j.platformFee);
          console.log('totalCustomerTaxes:', j.totalCustomerTaxes);
          console.log('customerTotal:', j.customerTotal);

          console.log('\n=== RECONCILIATION ===');
          const sum =
            j.foodSubtotal + (j.customerDeliveryFee || 0) + j.platformFee + j.totalCustomerTaxes;
          console.log('sum =', sum);
          console.log('customerTotal =', j.customerTotal);
          console.log('MATCH:', sum === j.customerTotal);
        });
      },
    );
    req.write(body);
    req.end();
  });
});
