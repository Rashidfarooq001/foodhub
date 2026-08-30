const fs = require('fs');
const path = 'apps/customer-web/src/components/tracking/OrderTimeline.tsx';
let content = fs.readFileSync(path, 'utf8');

// Replace everything from the first `        })}` to the end of the file with just one copy of the end
const badTail = /        \}\)\}\r?\n      <\/div>\r?\n    <\/div>\r?\n  \);\r?\n        \}\)\}\r?\n      <\/div>\r?\n    <\/div>\r?\n  \);\r?\n\};\r?\n?$/;
content = content.replace(badTail, `        })}\n      </div>\n    </div>\n  );\n};\n`);
fs.writeFileSync(path, content, 'utf8');
