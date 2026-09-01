const https = require('https');
const token = 'gejpjfjmbuahozfsiemzurkcxqcvcrejjkwi';
const eLoc1 = 'X1A902'; // watapora
const eLoc2 = 'QC7N17'; // bandipora
const url = `https://route.mappls.com/route/direction/route_adv/driving/${eLoc1};${eLoc2}?access_token=${token}`;

https.get(url, (res) => {
  let data = '';
  res.on('data', (chunk) => (data += chunk));
  res.on('end', () => console.log('RESPONSE route:', res.statusCode, data));
});
