const fs = require('fs');
const path = require('path');
function searchFiles(dir, regex) {
  let results = [];
  try {
    const files = fs.readdirSync(dir);
    for (const file of files) {
      if (file === 'node_modules' || file === '.git' || file === '.next') continue;
      const fullPath = path.join(dir, file);
      const stat = fs.statSync(fullPath);
      if (stat.isDirectory()) {
        results = results.concat(searchFiles(fullPath, regex));
      } else if (fullPath.endsWith('.ts') || fullPath.endsWith('.tsx') || fullPath.endsWith('.env') || fullPath.endsWith('.env.local')) {
        const content = fs.readFileSync(fullPath, 'utf8');
        if (regex.test(content)) {
          results.push(fullPath);
        }
      }
    }
  } catch(e){}
  return results;
}
const res = searchFiles(process.cwd(), /mappls|mapmyindia|NEXT_PUBLIC_MAPPLS/i);
console.log("FOUND MAPPLS IN:");
console.log(res.join('\n'));
