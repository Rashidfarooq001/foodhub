const fs = require('fs');

let content = fs.readFileSync('apps/admin-dashboard/src/components/layout/AdminSidebar.tsx', 'utf8');
content = content.replace(/\s*{\s*name:\s*'Support Tickets',\s*href:\s*'\/support-tickets',\s*icon:\s*HelpCircle\s*},/g, '');

fs.writeFileSync('apps/admin-dashboard/src/components/layout/AdminSidebar.tsx', content);
