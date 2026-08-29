const https = require('https');
const eloc = 'X1A902';
const token = 'gejpjfjmbuahozfsiemzurkcxqcvcrejjkwi';
const url = `https://explore.mappls.com/apis/O2O/entity/${eloc}?access_token=${token}`;

https.get(url, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => console.log('RESPONSE O2O:', res.statusCode, data));
});
