const fs = require('fs');
const path = require('path');

const SECRET_PATTERNS = [
  /['"](rzp_(test|live)_[a-zA-Z0-9]+)['"]/g,          // Razorpay Key
  /['"]([a-zA-Z0-9]{24,})['"]/g,                      // Long string possibly secret (will review manually)
  /API_KEY\s*[:=]\s*['"](.*?)['"]/gi,
  /JWT_SECRET\s*[:=]\s*['"](.*?)['"]/gi,
  /MSG91_AUTH_KEY\s*[:=]\s*['"](.*?)['"]/gi,
  /password\s*[:=]\s*['"](.*?)['"]/gi
];

function scanDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    if (file === 'node_modules' || file === 'dist' || file === '.next' || file === '.git') continue;
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      scanDir(fullPath);
    } else if (file.endsWith('.ts') || file.endsWith('.tsx') || file.endsWith('.js') || file.endsWith('.jsx')) {
      const content = fs.readFileSync(fullPath, 'utf8');
      
      let match;
      const razorpayRegex = /['"](rzp_(test|live)_[a-zA-Z0-9]+)['"]/g;
      while ((match = razorpayRegex.exec(content)) !== null) {
         console.log(`FOUND RAZORPAY in ${fullPath}: <REDACTED>`);
      }
      const mapplsRegex = /['"]([a-z0-9]{32})['"]/g; // Mappls is 32 char lowercase alphanumeric usually
      while ((match = mapplsRegex.exec(content)) !== null) {
         // ignore hashes like object IDs
         if (!/^[a-f0-9]{24}$/.test(match[1])) {
           // check if it looks like a mappls key (starts with something or just random)
         }
      }
    }
  }
}

console.log("Scanning...");
scanDir('apps');
scanDir('packages');
console.log("Scan complete");
