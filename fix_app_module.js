const fs = require('fs');

let content = fs.readFileSync('apps/backend/src/app.module.ts', 'utf8');
content = content.replace(/import { SupportTicketsModule } from '\.\/modules\/support-tickets\/support-tickets\.module';\r?\n/g, '');
content = content.replace(/\s*SupportTicketsModule,\r?\n/g, '\n');

fs.writeFileSync('apps/backend/src/app.module.ts', content);
