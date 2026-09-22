const http = require('http');
http.get('http://localhost:3001/api/restaurants/twinlight-1249', (res) => {
  let data = '';
  res.on('data', (chunk) => data += chunk);
  res.on('end', () => console.log(data));
}).on('error', (e) => console.error(e));
