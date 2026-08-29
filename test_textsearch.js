const https = require('https');
const token = 'gejpjfjmbuahozfsiemzurkcxqcvcrejjkwi';
const url = `https://search.mappls.com/search/address/textsearch?query=watapora&access_token=${token}`;

https.get(url, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => console.log('RESPONSE textsearch:', res.statusCode, data));
});
