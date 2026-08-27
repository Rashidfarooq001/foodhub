const fs = require('fs');
let code = fs.readFileSync('fix_location_modal.js', 'utf8');

code = code.replace(/useAddressStore'/g, "use-address-store'");

fs.writeFileSync('fix_location_modal.js', code);
