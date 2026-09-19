const fs = require('fs');
let file = 'apps/customer-web/src/app/forgot-password/page.tsx';
let txt = fs.readFileSync(file, 'utf8');

txt = txt.replace(
  "import { useState, useEffect, useRef } from 'react';",
  "import { useState, useEffect, useRef } from 'react';\nimport { useMsg91Widget } from '@/hooks/use-msg91-widget';"
);

txt = txt.replace(
  "export default function ForgotPasswordPage() {",
  "export default function ForgotPasswordPage() {\n  const { launchWidget, isWidgetLoading } = useMsg91Widget();"
);

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

// Manually replace the VERIFY_OTP UI part.
// The exact string in the file starts at ") : forgotStep === 'VERIFY_OTP' ? (" and ends at ") : (" before NEW_PASSWORD
const parts = txt.split(") : forgotStep === 'VERIFY_OTP' ? (");
if (parts.length === 2) {
  const p1 = parts[0];
  const rightHalf = parts[1];
  
  // Find the exact ") : (" that separates VERIFY_OTP and NEW_PASSWORD.
  // We can find it by looking for the NEW_PASSWORD form:
  // ") : (\n          <form onSubmit={handleSetNewPasswordSubmit}"
  const p2Idx = rightHalf.indexOf(") : (\n          <form onSubmit={handleSetNewPasswordSubmit}");
  if (p2Idx !== -1) {
    const p2 = rightHalf.substring(p2Idx);
    txt = p1 + p2;
  }
}

txt = txt.replace(/disabled=\{isLoading\}/g, "disabled={isLoading || isWidgetLoading}");
txt = txt.replace(/\{isLoading \? 'Sending Reset OTP\.\.\.' : 'Send Password Reset OTP'\}/g, "{isLoading || isWidgetLoading ? 'Launching secure OTP portal...' : 'Send Password Reset OTP'}");

fs.writeFileSync(file, txt);
console.log('Done manual fix.');
