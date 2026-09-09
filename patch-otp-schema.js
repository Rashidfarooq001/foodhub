const fs = require('fs');
const file = 'apps/backend/prisma/schema.prisma';
let content = fs.readFileSync(file, 'utf8');

const otpModelRegex = /model Otp \{[\s\S]*?\@\@map\("otps"\)\s*\}/;
const match = content.match(otpModelRegex);
if (match) {
  let modelStr = match[0];
  if (!modelStr.includes('attempts')) {
    modelStr = modelStr.replace('isUsed    Boolean  @default(false) @map("is_used")', 'isUsed    Boolean  @default(false) @map("is_used")\n  attempts  Int      @default(0)');
    content = content.replace(otpModelRegex, modelStr);
    fs.writeFileSync(file, content);
    console.log("Added attempts to Otp model");
  } else {
    console.log("attempts already exists");
  }
}
