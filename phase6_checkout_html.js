const https = require('https');

// Fetch checkout page and find the JS chunk that contains the checkout code
https.get({ 
  hostname: 'foodhub-customer-web-ten.vercel.app', 
  path: '/checkout',
  headers: { 'User-Agent': 'Mozilla/5.0' }
}, res => {
  let html = '';
  res.on('data', c => html += c.toString());
  res.on('end', () => {
    // Get ALL script src URLs
    const scripts = [...html.matchAll(/src="([^"]*_next[^"]*)"/g)].map(m => m[1]);
    console.log('Total scripts:', scripts.length);
    scripts.forEach(s => console.log(s));
    
    // Find buildId
    const nextData = html.match(/"buildId":"([^"]+)"/);
    if (nextData) console.log('\nBUILD ID:', nextData[1]);
    
    // Check __NEXT_DATA__
    const ndMatch = html.match(/<script id="__NEXT_DATA__"[^>]*>(.*?)<\/script>/s);
    if (ndMatch) {
      console.log('\n__NEXT_DATA__:', ndMatch[1].substring(0, 500));
    }
  });
});
