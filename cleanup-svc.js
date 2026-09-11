const fs = require("fs");
const path = "apps/backend/src/modules/auth/auth.service.ts";
let code = fs.readFileSync(path, "utf8");
code = code.replace(/  async adminTwoPasswordVerifyOtp[\s\S]*?async adminTwoPasswordResendOtp[\s\S]*?\n  \}\n/m, "");
fs.writeFileSync(path, code);
console.log("Removed dead methods from auth.service.ts");
