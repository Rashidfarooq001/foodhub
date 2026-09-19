const fs = require('fs');
let file = 'apps/customer-web/src/app/forgot-password/page.tsx';
let txt = fs.readFileSync(file, 'utf8');

txt = txt.replace(
  "const [otp, setOtp] = useState(['', '', '', '', '', '']);",
  "const [otp, setOtp] = useState(['', '', '', '']);"
);

txt = txt.replace(
  "setOtp(['', '', '', '', '', '']);",
  "setOtp(['', '', '', '']);"
);

txt = txt.replace(
  "if (enteredOtp.length < 6) {",
  "if (enteredOtp.length < 4) {"
);

txt = txt.replace(
  "setError('Please enter the 6-digit OTP code');",
  "setError('Please enter the 4-digit OTP code');"
);

txt = txt.replace(
  "Enter 6-Digit MSG91 OTP",
  "Enter 4-Digit MSG91 OTP"
);

txt = txt.replace(
  "if (e.target.value && idx < 5)",
  "if (e.target.value && idx < 3)"
);

fs.writeFileSync(file, txt);
console.log('Reverted to 4 boxes.');
