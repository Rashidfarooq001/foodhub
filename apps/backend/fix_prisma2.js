const fs = require('fs');
let content = fs.readFileSync('prisma/schema.prisma', 'utf8');
content = content + `\nenum TicketPriority {\n  LOW\n  MEDIUM\n  HIGH\n  URGENT\n}\n`;
fs.writeFileSync('prisma/schema.prisma', content);
