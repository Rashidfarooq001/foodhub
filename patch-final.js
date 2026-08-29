const fs = require('fs');
const path = require('path');
const file = path.join('apps', 'backend', 'src', 'modules', 'settlements', 'settlements.service.ts');
let content = fs.readFileSync(file, 'utf8');

content = content.replace(/import { PrismaService } from "\.\.\/\.\.\/core\/prisma\/prisma\.service";/g, 'import { PrismaService } from "../database/prisma.service";');
content = content.replace(/async getReconciliationReport\(\) \{/g, 'async getReconciliationReport(p1?: any, p2?: any, p3?: any) {');

fs.writeFileSync(file, content, 'utf8');
console.log("Patched service imports and args");
