const https = require('https');

async function test() {
  const req = https.request('https://api.zaykafood.online/api/v1/delivery/active-jobs', {
    method: 'GET',
    headers: { 'Authorization': 'Bearer test' }
  }, (res) => {
    let data = '';
    res.on('data', d => data += d);
    res.on('end', () => console.log('active-jobs:', res.statusCode, data));
  });
  req.on('error', console.error);
  req.end();
}
test();
