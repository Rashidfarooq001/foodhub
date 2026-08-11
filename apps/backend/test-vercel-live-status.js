const https = require('https');

function checkUrl(url) {
  return new Promise((resolve) => {
    https
      .get(url, (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          resolve({
            url,
            statusCode: res.statusCode,
            headers: res.headers,
            bodySnippet: data.substring(0, 300),
          });
        });
      })
      .on('error', (err) => {
        resolve({ url, error: err.message });
      });
  });
}

async function main() {
  console.log('=== CHECKING LIVE PRODUCTION DEPLOYMENTS STATUS ===\n');

  const urls = [
    'https://foodhub-hotel-dashboard.vercel.app/login',
    'https://foodhub-backend-enq2.onrender.com/api/v1/health',
  ];

  for (const url of urls) {
    const res = await checkUrl(url);
    console.log(`URL: ${res.url}`);
    if (res.error) {
      console.log(`ERROR: ${res.error}\n`);
    } else {
      console.log(`Status Code: ${res.statusCode}`);
      console.log(`Vercel Cache: ${res.headers['x-vercel-cache'] || 'N/A'}`);
      console.log(`Vercel Execution: ${res.headers['x-vercel-id'] || 'N/A'}`);
      console.log(`Server: ${res.headers['server'] || 'N/A'}`);
      console.log(`Body Snippet: ${res.bodySnippet.replace(/\s+/g, ' ')}\n`);
    }
  }
}

main();
