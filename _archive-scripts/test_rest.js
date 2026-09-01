const https = require('https');
const eloc = 'X1A902';
const token = 'gejpjfjmbuahozfsiemzurkcxqcvcrejjkwi';
const url = `https://atlas.mappls.com/api/places/geocode?address=${eloc}`; // maybe atlas uses eLoc as address? No.
const url2 = `https://apis.mappls.com/advancedmaps/v1/${token}/place_detail?pin=${eloc}`;

https.get(url2, (res) => {
  let data = '';
  res.on('data', (chunk) => (data += chunk));
  res.on('end', () => console.log('RESPONSE REST:', res.statusCode, data));
});
