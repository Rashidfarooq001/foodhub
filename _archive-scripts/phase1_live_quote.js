const https = require('https');

// PHASE 1: Hit the LIVE backend directly with a quote request
// PHASE 2: Capture the COMPLETE JSON response - every single field

const body = JSON.stringify({
  restaurantId: undefined,
  foodSubtotal: 150,
  latitude: 34.09,
  longitude: 74.79,
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
  (res) => {
    let data = '';
    res.on('data', (c) => (data += c));
    res.on('end', () => {
      console.log('HTTP STATUS:', res.statusCode);
      console.log('');
      console.log('=== RAW COMPLETE JSON RESPONSE ===');
      console.log(data);
      console.log('');
      try {
        const j = JSON.parse(data);
        console.log('=== INDIVIDUAL FIELD EXTRACTION ===');
        console.log('foodSubtotal:', j.foodSubtotal);
        console.log('customerDeliveryFee:', j.customerDeliveryFee);
        console.log('platformFee:', j.platformFee);
        console.log('totalCustomerTaxes:', j.totalCustomerTaxes);
        console.log('customerTotal:', j.customerTotal);
        console.log('restaurantFoodGst:', j.restaurantFoodGst);
        console.log('platformFeeGst:', j.platformFeeGst);
        console.log('deliveryFeeGst:', j.deliveryFeeGst);
        console.log('smallOrderFee:', j.smallOrderFee);
        console.log('taxItems:', JSON.stringify(j.taxItems, null, 2));
        console.log('');
        console.log('=== RECONCILIATION CHECK ===');
        const sum = j.foodSubtotal + j.customerDeliveryFee + j.platformFee + j.totalCustomerTaxes;
        console.log('foodSubtotal + deliveryFee + platformFee + totalCustomerTaxes =', sum);
        console.log('customerTotal =', j.customerTotal);
        console.log('MATCH:', sum === j.customerTotal);
      } catch (e) {
        console.error('Parse error:', e.message);
      }
    });
  },
);
req.on('error', (e) => console.error('Request error:', e.message));
req.write(body);
req.end();
