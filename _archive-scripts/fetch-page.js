const fs = require('fs');

async function run() {
  const res = await fetch('http://localhost:3000');
  const text = await res.text();
  fs.writeFileSync('page.html', text);
}
run();
