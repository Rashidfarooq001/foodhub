const https = require('https');
const url = `https://outpost.mappls.com/api/places/geocode?eLoc=X1A902&access_token=gejpjfjmbuahozfsiemzurkcxqcvcrejjkwi`;
https.get(url, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => console.log('RESPONSE:', res.statusCode, data));
});
