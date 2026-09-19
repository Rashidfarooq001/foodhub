const fs = require('fs');
let file = 'apps/customer-web/src/app/forgot-password/page.tsx';
let txt = fs.readFileSync('scratch/old-forgot.txt', 'utf8');

txt = txt.replace(
  "import { useState, useEffect, useRef } from 'react';",
  "import { useState, useEffect, useRef } from 'react';\nimport { useMsg91Widget } from '@/hooks/use-msg91-widget';"
);

txt = txt.replace(
  "export default function ForgotPasswordPage() {",
  "export default function ForgotPasswordPage() {\n  const { launchWidget, isWidgetLoading } = useMsg91Widget();"
);

txt = txt.replace(/const \[otp, setOtp\].*?;\n/s, '');

const newSend = `
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
txt = txt.replace(/const handleSendResetOtp = async.*?finally \{\s*setIsLoading\(false\);\s*\}\s*\};/s, newSend);

txt = txt.replace(/const handleVerifyResetOtpManual = async.*?finally \{\s*setIsLoading\(false\);\s*\}\s*\};/s, '');

const regex = /\{forgotStep === 'SEND_OTP' \? \([\s\S]*?\) : forgotStep === 'VERIFY_OTP' \? \([\s\S]*?\) : \([\s\S]*?\)\}/s;
const match = txt.match(regex);
if (match) {
  const parts = match[0].split(/: forgotStep === 'VERIFY_OTP' \? \(/);
  if (parts.length === 2) {
    const part1 = parts[0];
    const parts2 = parts[1].split(/\) : \(/);
    const newPasswordUI = parts2.slice(1).join(") : (");
    txt = txt.replace(match[0], part1 + " : (" + newPasswordUI);
  }
}

txt = txt.replace(/disabled=\{isLoading\}/g, "disabled={isLoading || isWidgetLoading}");
txt = txt.replace(/\{isLoading \? 'Sending Reset OTP\.\.\.' : 'Send Password Reset OTP'\}/g, "{isLoading || isWidgetLoading ? 'Launching secure OTP portal...' : 'Send Password Reset OTP'}");

fs.writeFileSync(file, txt);
console.log('Done rewriting.');
