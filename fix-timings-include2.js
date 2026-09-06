const fs = require('fs');

const path = 'apps/backend/src/modules/restaurants/restaurants.service.ts';
let content = fs.readFileSync(path, 'utf8');

// Use a simple, unambiguous approach: find the update({where:{id},...}) for the status change
// and add include: {timings: true} before the closing });
const oldSnip = '            ? rejectionReason?.trim() || null\r\n            : null,\r\n      },\r\n    });';
const newSnip = '            ? rejectionReason?.trim() || null\r\n            : null,\r\n      },\r\n      include: { timings: true },\r\n    });';

console.log('Searching... includes:', content.includes(oldSnip));
if (content.includes(oldSnip)) {
  content = content.replace(oldSnip, newSnip);
  fs.writeFileSync(path, content);
  console.log('Fixed.');
} else {
  // Try unix line endings
  const oldUnix = oldSnip.replace(/\r\n/g, '\n');
  const newUnix = newSnip.replace(/\r\n/g, '\n');
  if (content.includes(oldUnix)) {
    content = content.replace(oldUnix, newUnix);
    fs.writeFileSync(path, content);
    console.log('Fixed (unix).');
  } else {
    console.error('Could not find target.');
  }
}
