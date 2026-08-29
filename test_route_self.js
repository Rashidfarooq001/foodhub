const https = require('https');
const token = 'gejpjfjmbuahozfsiemzurkcxqcvcrejjkwi';
const eLoc1 = 'X1A902'; // watapora
const url = `https://route.mappls.com/route/direction/route_adv/driving/${eLoc1};${eLoc1}?access_token=${token}`;

https.get(url, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => console.log('RESPONSE self-route:', res.statusCode, data));
});
