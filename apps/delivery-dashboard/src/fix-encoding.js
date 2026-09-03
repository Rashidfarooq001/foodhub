const fs = require('fs');
const path = require('path');

function fixEncoding(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      fixEncoding(fullPath);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      if (content.includes(',1') || content.includes('\uFFFD,1') || content.includes('₹')) {
        content = content.replace(/,1/g, '?');
        content = content.replace(/\uFFFD,1/g, '?');
        content = content.replace(/₹/g, '?');
        fs.writeFileSync(fullPath, content, 'utf8');
      }
    }
  }
}
fixEncoding('apps/delivery-dashboard/src');
