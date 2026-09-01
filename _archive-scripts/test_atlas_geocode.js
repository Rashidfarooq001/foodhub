const https = require('https');
const token = 'gejpjfjmbuahozfsiemzurkcxqcvcrejjkwi';
const url = `https://atlas.mappls.com/api/places/geocode?address=watapora&access_token=${token}`;

https.get(url, (res) => {
  let data = '';
  res.on('data', (chunk) => (data += chunk));
  res.on('end', () => console.log('RESPONSE atlas geocode:', res.statusCode, data));
});
