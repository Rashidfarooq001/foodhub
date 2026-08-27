const fs = require('fs');

let content = fs.readFileSync('apps/backend/prisma/schema.prisma', 'utf8');

content = content.replace(/enum TicketStatus \{[\s\S]*?\}/, '');
content = content.replace(/enum TicketPriority \{[\s\S]*?\}/, '');
content = content.replace(/model SupportTicket \{[\s\S]*?\}/, '');
content = content.replace(/model SupportMessage \{[\s\S]*?\}/, '');
content = content.replace(/model TicketAttachment \{[\s\S]*?\}/, '');

// Also remove from User model
content = content.replace(/\s*supportTickets\s+SupportTicket\[\]\s*/g, '\n');

fs.writeFileSync('apps/backend/prisma/schema.prisma', content);
