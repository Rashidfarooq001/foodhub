const https = require('https');
const url = `https://search.mappls.com/apis/O2O/entity/X1A902?access_token=gejpjfjmbuahozfsiemzurkcxqcvcrejjkwi`;
https.get(url, (res) => {
  console.log('STATUS:', res.statusCode);
});
