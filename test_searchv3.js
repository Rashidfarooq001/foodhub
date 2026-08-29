const https = require('https');
const token = 'gejpjfjmbuahozfsiemzurkcxqcvcrejjkwi';
const url = `https://search.mappls.com/apis/searchV3?query=watapora&region=IND&access_token=${token}`;

https.get(url, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => console.log('RESPONSE searchV3:', res.statusCode, data));
});
