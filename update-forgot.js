const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, 'apps/customer-web/src/app/forgot-password/page.tsx');
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  "import { useState, useEffect, useRef } from 'react';",
  "import { useState, useEffect, useRef } from 'react';\nimport { useMsg91Widget } from '@/hooks/use-msg91-widget';"
);

content = content.replace(
  "const [otp, setOtp] = useState(['', '', '', '', '', '']);",
  ""
);

const newSendOtp = `
  const { launchWidget, isWidgetLoading } = useMsg91Widget();

  const handleSendResetOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanDigits = phone.replace(/\\D/g, '');
    if (cleanDigits.length < 10) {
      setError('Please enter a valid 10-digit registered mobile number');
      return;
    }

    setResetToken('');
    setError('');
    setSuccessMsg('');

    try {
      const accessToken = await launchWidget(phone);
      await handleVerifyResetWidgetToken(accessToken);
    } catch (err: any) {
      setError(err.message || 'Error requesting reset code.');
    }
  };
`;

content = content.replace(/const handleSendResetOtp = async.*?};\n/s, newSendOtp);

content = content.replace(/const handleVerifyResetOtpManual = async.*?};\n/s, "");

const uiRegex = /\{forgotStep === 'SEND_OTP' \? \([\s\S]*?\) : forgotStep === 'VERIFY_OTP' \? \([\s\S]*?\) : \([\s\S]*?\)\}/s;
const match = content.match(uiRegex);
if (match) {
  const fullMatch = match[0];
  const parts = fullMatch.split(/: forgotStep === 'VERIFY_OTP' \? \(/);
  if (parts.length === 2) {
    const part1 = parts[0]; 
    const part2 = parts[1];
    
    const parts2 = part2.split(/\) : \(/);
    const newPasswordUI = parts2.slice(1).join(") : ("); 
    
    const newUI = part1 + " : (" + newPasswordUI;
    content = content.replace(fullMatch, newUI);
  }
}

content = content.replace(/disabled=\{isLoading\}/g, "disabled={isLoading || isWidgetLoading}");
content = content.replace(/\{isLoading \? 'Sending Reset OTP\.\.\.' : 'Send Password Reset OTP'\}/g, "{isLoading || isWidgetLoading ? 'Launching secure OTP portal...' : 'Send Password Reset OTP'}");

fs.writeFileSync(file, content);
console.log('Successfully updated forgot-password/page.tsx');
