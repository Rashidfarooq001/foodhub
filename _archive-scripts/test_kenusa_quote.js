const https = require('https');
const payload = JSON.stringify({
  foodSubtotal: 250,
  restaurantId: '0591d52e-8515-4cf7-9c4c-e0f9133bc916',
  latitude: 34.385822, // Kenusa
  longitude: 74.52294,
  locationSource: 'MANUAL_GEOCODED',
});

const req = https.request(
  {
    hostname: 'foodhub-backend-enq2.onrender.com',
    path: '/api/v1/orders/quote',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(payload),
    },
  },
  (resQuote) => {
    let quoteData = '';
    resQuote.on('data', (chunk) => (quoteData += chunk));
    resQuote.on('end', () => console.log('Quote for Kenusa:', resQuote.statusCode, quoteData));
  },
);
req.write(payload);
req.end();
