const fs = require('fs');
const path = require('path');

function checkFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const regex =
    /if\s*\([^)]+\)\s*(?:return|{\s*return[^}]*})\s*;?\s*[\s\S]{0,100}?(?:const\s+\[[^\]]+\]\s*=\s*use\w+|use\w+\s*\()/g;

  // We only care if it's outside of a hook callback, but regex is dumb, so just print matches
  let match;
  while ((match = regex.exec(content)) !== null) {
    console.log(`Potential bad hook in ${filePath}`);
    break; // Only need one match per file
  }
}

function processDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      processDir(fullPath);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
      checkFile(fullPath);
    }
  }
}

processDir('apps/customer-web/src');
