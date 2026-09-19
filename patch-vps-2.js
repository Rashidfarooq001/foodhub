const fs = require('fs');
let file = '/root/zayka-backend/dist/src/modules/otp/otp.service.js';
let txt = fs.readFileSync(file, 'utf8');

const regex = /const response = await fetch\('https:\/\/api\.msg91\.com\/api\/v5\/widget\/verifyAccessToken', \{\s*method: 'POST',\s*headers: \{\s*'Content-Type': 'application\/json',\s*Accept: 'application\/json',\s*authkey: authKey\s*\},\s*body: JSON\.stringify\(\{\s*'access-token': accessToken,\s*\}\),\s*\}\);/g;

const replacement = `let response = await fetch('https://api.msg91.com/api/v5/widget/verifyAccessToken', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            authkey: authKey
        },
        body: JSON.stringify({
            'access-token': accessToken,
        }),
    });
    
    let tempJson = await response.clone().json();
    if (tempJson.type === 'error' && tempJson.message === 'AuthenticationFailure') {
        console.log('[Backend MSG91] First authkey failed, trying widgetId as authkey...');
        response = await fetch('https://api.msg91.com/api/v5/widget/verifyAccessToken', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Accept: 'application/json',
                authkey: '3668626d5043313835303335'
            },
            body: JSON.stringify({
                'access-token': accessToken,
            }),
        });
    }
`;

let updatedTxt = txt.replace(regex, replacement);
if (updatedTxt !== txt) {
  fs.writeFileSync(file, updatedTxt);
  console.log('Patched JS again!');
} else {
  console.log('Regex did not match.');
}
