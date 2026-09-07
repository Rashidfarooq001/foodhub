const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'apps/backend/src/modules/orders/order-lifecycle.service.ts');
let content = fs.readFileSync(filePath, 'utf8');

function injectTimeouts(text) {
  const searchStr = 'this.prisma.$transaction(async (tx) => {';
  let startIndex = 0;
  
  while ((startIndex = text.indexOf(searchStr, startIndex)) !== -1) {
    let braceCount = 0;
    let i = startIndex + searchStr.length - 1; // position of '{'
    
    if (text[i] !== '{') {
      startIndex += searchStr.length;
      continue;
    }
    
    braceCount++;
    i++;
    
    while (braceCount > 0 && i < text.length) {
      if (text[i] === '{') braceCount++;
      if (text[i] === '}') braceCount--;
      i++;
    }
    
    // Now i is just after the closing '}'
    // So text.substring(i) starts with ');' or ')'
    if (text.substring(i, i + 2) === ');') {
      // Replace the ');' with ', { maxWait: 15000, timeout: 30000 });'
      text = text.substring(0, i) + ', {\n      maxWait: 15000,\n      timeout: 30000,\n    });' + text.substring(i + 2);
    } else if (text.substring(i, i + 1) === ')') {
      text = text.substring(0, i) + ', {\n      maxWait: 15000,\n      timeout: 30000,\n    })' + text.substring(i + 1);
    }
    
    startIndex = i; // move past this block
  }
  return text;
}

const newContent = injectTimeouts(content);
fs.writeFileSync(filePath, newContent, 'utf8');
console.log('Patched timeouts successfully');
