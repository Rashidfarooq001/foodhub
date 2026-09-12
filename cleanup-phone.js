const fs = require("fs");
const path = "apps/backend/src/modules/auth/auth.service.ts";
let code = fs.readFileSync(path, "utf8");
code = code.replace(/          \{ phone: process\.env\.ADMIN_PHONE_OVERRIDE \|\| '\+910000000000' \},\n/g, "");
fs.writeFileSync(path, code);
console.log("Removed ADMIN_PHONE_OVERRIDE from auth.service.ts");
