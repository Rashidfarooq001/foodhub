const fs = require('fs');
const path = require('path');

const srcDir = 'apps/backend/src/modules';
const inventory = {
  controllers: [],
  endpoints: [],
  gateways: [],
  models: []
};

// 1. Prisma Models
const schema = fs.readFileSync('apps/backend/prisma/schema.prisma', 'utf8');
const models = schema.match(/^model\s+(\w+)\s+\{/gm);
if (models) {
  inventory.models = models.map(m => m.split(' ')[1]);
}

// 2. Controllers & Endpoints
function scanDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      scanDir(fullPath);
    } else if (fullPath.endsWith('.controller.ts')) {
      inventory.controllers.push(file);
      const content = fs.readFileSync(fullPath, 'utf8');
      
      // Basic endpoint extraction
      const methods = content.match(/@(Get|Post|Put|Patch|Delete|Options|Head)\((.*?)\)/g);
      if (methods) {
        inventory.endpoints.push(...methods.map(m => `${file} -> ${m}`));
      }
    } else if (fullPath.endsWith('.gateway.ts')) {
      inventory.gateways.push(file);
    }
  }
}

if (fs.existsSync(srcDir)) {
  scanDir(srcDir);
}

fs.writeFileSync('security_inventory.json', JSON.stringify(inventory, null, 2));
console.log(`Inventory complete: ${inventory.models.length} models, ${inventory.controllers.length} controllers, ${inventory.endpoints.length} endpoints, ${inventory.gateways.length} gateways.`);
