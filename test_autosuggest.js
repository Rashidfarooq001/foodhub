const https = require('https');
const token = 'gejpjfjmbuahozfsiemzurkcxqcvcrejjkwi';
const url = `https://search.mappls.com/search/address/autosuggest?query=watapora&access_token=${token}`;

https.get(url, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => console.log('RESPONSE autosuggest:', res.statusCode, data));
});
