const https = require('https');
const payload = JSON.stringify({ query: 'bandipora' });

const req = https.request(
  {
    hostname: 'foodhub-backend-enq2.onrender.com',
    path: '/api/v1/location/resolve',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(payload),
    },
  },
  (res) => {
    let data = '';
    res.on('data', (chunk) => (data += chunk));
    res.on('end', () => {
      const json = JSON.parse(data);
      console.log('Bandipora:', json.latitude, json.longitude);
      const quotePayload = JSON.stringify({
        foodSubtotal: 250,
        restaurantId: '0591d52e-8515-4cf7-9c4c-e0f9133bc916',
        latitude: json.latitude,
        longitude: json.longitude,
        locationSource: 'MANUAL_GEOCODED',
      });
      const quoteReq = https.request(
        {
          hostname: 'foodhub-backend-enq2.onrender.com',
          path: '/api/v1/orders/quote',
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(quotePayload),
          },
        },
        (resQuote) => {
          let quoteData = '';
          resQuote.on('data', (chunk) => (quoteData += chunk));
          resQuote.on('end', () => console.log('Quote for Bandipora:', quoteData));
        },
      );
      quoteReq.write(quotePayload);
      quoteReq.end();
    });
  },
);
req.write(payload);
req.end();
