const https = require('https');

async function checkUrl(url) {
  return new Promise((resolve) => {
    https
      .get(url, (res) => {
        console.log(`URL: ${url}`);
        console.log(`HTTP Status: ${res.statusCode}`);
        console.log(`Headers:`, res.headers);
        resolve(res.statusCode);
      })
      .on('error', (err) => {
        console.error(`Fetch Error: ${err.message}`);
        resolve(null);
      });
  });
}

async function main() {
  console.log('=== CHECKING RENDER BACKEND UPLOADS ACCESSIBILITY ===\n');
  const targetUrl =
    'https://foodhub-backend-enq2.onrender.com/uploads/file-1786418341995-927432595.jpg';
  const status = await checkUrl(targetUrl);

  console.log(`\nFinal HTTP Status: ${status}`);
  if (status === 200) {
    console.log('SUCCESS: Render backend correctly serves uploaded file! ✅');
  } else {
    console.log(`FAILURE: Render backend returned HTTP ${status}! ❌`);
  }
}

main();
