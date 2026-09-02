const http = require('http');

async function test() {
  const req = http.request({
    hostname: 'localhost',
    port: 3001,
    path: '/api/v1/delivery/current',
    method: 'GET',
    headers: {
      'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJkYjljZTU2Zi0xN2FkLTQ4MTEtYjk1Ni0yYjBlYTBhOTM4YjgiLCJpZCI6ImRiOWNlNTZmLTE3YWQtNDgxMS1iOTU2LTJiMGVhMGE5MzhiOCIsInJvbGUiOiJERUxJVkVSWV9QQVJUTkVSIiwiaWF0IjoxNzg4MzYzNjI3LCJleHAiOjE3ODgzNjcyMjd9.aiRUK9xOeSCOMeY8YmVs7Cjn-CmH2117bW88aHnVWvo'
    }
  }, res => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => console.log('STATUS:', res.statusCode, 'DATA:', data));
  });
  req.on('error', e => console.error('ERROR:', e.message));
  req.end();
}
test();
