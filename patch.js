const fs = require("fs");
const path = "/root/zayka-backend/dist/src/modules/auth/auth.service.js";
let code = fs.readFileSync(path, "utf8");
code = code.replace(/preAuthToken,\s*maskedPhone:\s*'[^']+'\s*\+\s*adminUser\.phone\.slice\(-4\)/g, 'preAuthToken: "HELLO_WORLD", maskedPhone: "TEST"');
fs.writeFileSync(path, code);
console.log("Patched auth.service.js on VPS");
