const fs = require('fs');
let file = '/root/zayka-backend/dist/src/modules/otp/otp.service.js';
let txt = fs.readFileSync(file, 'utf8');
const search = "https://control.msg91.com/api/v5/widget/verifyAccessToken";
const replaceURL = "https://api.msg91.com/api/v5/widget/verifyAccessToken";

// The compiled JS has this object being passed:
// { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify({ authkey: authKey, 'access-token': accessToken }) }

// We can just use a simple string replace for the fetch part if we construct it properly.
// Or we can just use regex.

const regex = /const response = await fetch\('https:\/\/control\.msg91\.com\/api\/v5\/widget\/verifyAccessToken', \{\s*method: 'POST',\s*headers: \{\s*'Content-Type': 'application\/json',\s*Accept: 'application\/json',\s*\},\s*body: JSON\.stringify\(\{\s*authkey: authKey,\s*'access-token': accessToken,\s*\}\),\s*\}\);/g;

const replacement = `const response = await fetch('https://api.msg91.com/api/v5/widget/verifyAccessToken', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            authkey: authKey
        },
        body: JSON.stringify({
            'access-token': accessToken,
        }),
    });`;

let updatedTxt = txt.replace(regex, replacement);

if (updatedTxt !== txt) {
  fs.writeFileSync(file, updatedTxt);
  console.log('Patched JS!');
} else {
  console.log('Regex did not match in JS. Searching for index...');
  
  // fallback for compiled output
  let idx = txt.indexOf(search);
  if(idx !== -1) {
    let startFetch = txt.substring(0, idx - 21); // before `const response = await fetch(`
    let afterFetchStr = "});";
    let afterFetchIdx = txt.indexOf(afterFetchStr, idx);
    let afterFetch = txt.substring(afterFetchIdx + 3);
    
    fs.writeFileSync(file, startFetch + replacement + afterFetch);
    console.log('Patched via fallback string slicing!');
  } else {
    console.log('Could not find fetch call to patch.');
  }
}
