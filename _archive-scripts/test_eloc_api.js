const https = require('https');
const token = 'gejpjfjmbuahozfsiemzurkcxqcvcrejjkwi';
const url = `https://search.mappls.com/search/address/eloc?eloc=X1A902&access_token=${token}`;

https.get(url, (res) => {
  let data = '';
  res.on('data', (chunk) => (data += chunk));
  res.on('end', () => console.log('RESPONSE:', res.statusCode, data));
});
