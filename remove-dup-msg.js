const fs = require('fs');
let file = 'apps/customer-web/src/app/forgot-password/page.tsx';
let txt = fs.readFileSync(file, 'utf8');

txt = txt.replace(
  /setSuccessMsg\('OTP verified successfully! Please enter your new password\.'\);/g,
  "setSuccessMsg('');"
);

fs.writeFileSync(file, txt);
console.log('Removed duplicate success message.');
