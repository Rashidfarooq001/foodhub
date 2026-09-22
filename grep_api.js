const fs = require('fs');
const exec = require('child_process').execSync;
try {
  const result = exec('git grep -n "getApiBaseUrl"').toString();
  console.log(result);
} catch(e) { console.log(e.toString()); }
