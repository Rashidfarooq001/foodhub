const fs = require('fs');
let content = fs.readFileSync('apps/customer-web/src/app/orders/[id]/page.tsx', 'utf8');

const regex = /\{showSupportModal && \([\s\S]*?Submit Ticket[\s\S]*?\n          \)\}/;
if (content.match(regex)) {
    console.log("Matched!");
} else {
    console.log("Did not match");
}
