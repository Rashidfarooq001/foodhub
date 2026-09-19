const fs = require('fs');
let file = 'apps/customer-web/src/app/forgot-password/page.tsx';
let txt = fs.readFileSync(file, 'utf8');

txt = txt.replace(
  "import React, { useState, useEffect, useRef } from 'react';",
  "import React, { useState, useEffect, useRef } from 'react';\nimport { useMsg91Widget } from '@/hooks/use-msg91-widget';"
);

// We need to replace the entire VERIFY_OTP UI branch.
// Let's use regex with [\s\S]
const regex = /\) : forgotStep === 'VERIFY_OTP' \? \([\s\S]*?\) : \([\s\S]*?<form onSubmit=\{handleSetNewPasswordSubmit\}/s;
txt = txt.replace(regex, `) : (\n          <form onSubmit={handleSetNewPasswordSubmit}`);

// Also fix the text at the top
const textRegex = /: forgotStep === 'VERIFY_OTP'[\s\S]*?\? 'Enter 6-digit SMS OTP sent to your mobile number'[\s\S]*?: /s;
txt = txt.replace(textRegex, ": ");

fs.writeFileSync(file, txt);
console.log('Fixed properly');
