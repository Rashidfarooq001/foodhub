const fs = require('fs');
let file = 'apps/backend/src/modules/otp/otp.service.ts';
let txt = fs.readFileSync(file, 'utf8');

const regex = /const response = await fetch\('https:\/\/control\.msg91\.com\/api\/v5\/widget\/verifyAccessToken', \{\s*method: 'POST',\s*headers: \{\s*'Content-Type': 'application\/json',\s*Accept: 'application\/json',\s*\},\s*body: JSON\.stringify\(\{\s*authkey: authKey,\s*'access-token': accessToken,\s*\}\),\s*\}\);/g;

const replacement = `const response = await fetch('https://api.msg91.com/api/v5/widget/verifyAccessToken', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          authkey: authKey,
        },
        body: JSON.stringify({
          'access-token': accessToken,
        }),
      });`;

const updatedTxt = txt.replace(regex, replacement);
if (updatedTxt === txt) {
  console.log("No replacement made. Regex didn't match.");
} else {
  fs.writeFileSync(file, updatedTxt);
  console.log("Successfully fixed backend MSG91 verify call.");
}
