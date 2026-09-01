const https = require('https');
const token = 'gejpjfjmbuahozfsiemzurkcxqcvcrejjkwi';
const url = `https://search.mappls.com/search/address/geocode?address=watapora&itemCount=1&getCoordinate=true&access_token=${token}`;

https.get(url, (res) => {
  let data = '';
  res.on('data', (chunk) => (data += chunk));
  res.on('end', () => console.log('RESPONSE:', res.statusCode, data));
});
