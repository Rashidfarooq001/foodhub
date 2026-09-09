const fs = require('fs');
const path = require('path');

const srcDir = 'apps/backend/src/modules';
let output = [];

function scanDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      scanDir(fullPath);
    } else if (fullPath.endsWith('.controller.ts')) {
      const content = fs.readFileSync(fullPath, 'utf8');
      
      const methods = content.match(/@(Get|Post|Put|Patch|Delete)\(['"]([^'"]*)['"]\)?[\s\S]*?(?=@(Get|Post|Put|Patch|Delete)|$)/g);
      if (methods) {
        for (const m of methods) {
          const isGuarded = m.includes('JwtAuthGuard');
          const hasRoles = m.includes('@Roles(');
          const hasUserId = m.includes('userId') || m.includes('customerId') || m.includes('restaurantId');
          
          if (isGuarded && !hasRoles) {
             const nameMatch = m.match(/(?:async\s+)?(\w+)\s*\(/);
             const name = nameMatch ? nameMatch[1] : 'unknown';
             output.push(`${file} -> ${name}`);
          }
        }
      }
    }
  }
}

if (fs.existsSync(srcDir)) {
  scanDir(srcDir);
}

fs.writeFileSync('rbac_missing.txt', output.join('\n'));
console.log(`Found ${output.length} methods with JwtAuthGuard but no @Roles.`);
