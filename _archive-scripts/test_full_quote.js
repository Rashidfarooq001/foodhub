const https = require('https');

https.get('https://foodhub-backend-enq2.onrender.com/api/v1/restaurants', (res) => {
  let data = '';
  res.on('data', (chunk) => (data += chunk));
  res.on('end', () => {
    const restaurants = JSON.parse(data);
    const rest = restaurants[0];
    if (!rest) return console.log('No restaurant found');
    console.log(`Testing with restaurant: ${rest.name} (${rest.id})`);

    const payload = JSON.stringify({
      foodSubtotal: 250,
      restaurantId: rest.id,
      latitude: 34.422182, // Watapora
      longitude: 74.610507,
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
        resQuote.on('end', () =>
          console.log('Quote for Watapora:', resQuote.statusCode, quoteData),
        );
      },
    );
    req.write(payload);
    req.end();
  });
});
