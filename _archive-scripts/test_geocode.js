const https = require('https');
const token = 'gejpjfjmbuahozfsiemzurkcxqcvcrejjkwi';
const url = `https://search.mappls.com/search/address/geocode?address=watapora&access_token=${token}`;

https.get(url, (res) => {
  let data = '';
  res.on('data', (chunk) => (data += chunk));
  res.on('end', () => console.log('RESPONSE Geocode:', res.statusCode, data));
});
