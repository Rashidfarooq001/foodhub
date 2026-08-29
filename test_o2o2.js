const https = require('https');
const eloc = 'X1A902';
const token = 'gejpjfjmbuahozfsiemzurkcxqcvcrejjkwi';
const options = {
  hostname: 'explore.mappls.com',
  path: `/apis/O2O/entity/${eloc}`,
  headers: {
    'Authorization': `Bearer ${token}`
  }
};

https.get(options, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => console.log('RESPONSE O2O (Bearer):', res.statusCode, data));
});
