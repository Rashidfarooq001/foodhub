const https = require('https');
https.get('https://zaykafood.online', (res) => {
  let html = '';
  res.on('data', d => html+=d);
  res.on('end', () => {
    const scripts = html.match(/src="(\/_next\/static\/chunks\/[^"]+)"/g) || [];
    console.log('Found', scripts.length, 'scripts');
    scripts.forEach(s => {
      const url = 'https://zaykafood.online' + s.match(/"([^"]+)"/)[1];
      https.get(url, (r) => {
        let js = '';
        r.on('data', d => js+=d);
        r.on('end', () => {
          if (js.includes('sdk.mappls.com')) {
            const match = js.match(/access_token=([a-zA-Z0-9_-]+)/);
            if (match) console.log('FOUND KEY:', match[1]);
          }
        });
      }).on('error', ()=>{});
    });
  });
}).on('error', console.error);
