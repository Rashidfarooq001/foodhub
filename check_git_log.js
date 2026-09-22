const exec = require('child_process').execSync;
try {
  const result = exec('git log -S "o.orderNumber || o.id.split" -p').toString();
  console.log(result.substring(0, 1500));
} catch(e) { console.log(e.toString()); }
