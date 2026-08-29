const https = require('https');
https.get('https://foodhub-backend-enq2.onrender.com/api/v1/tax/rules', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    const rules = JSON.parse(data);
    const foodGst = rules.find(r => r.code === 'RESTAURANT_FOOD_SERVICE');
    console.log('Food GST Rate:', foodGst?.rate);
  });
});
