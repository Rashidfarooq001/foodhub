const fs = require("fs");
const path = "apps/backend/src/modules/auth/auth.controller.ts";
let code = fs.readFileSync(path, "utf8");
code = code.replace(/  @Public\(\)[\s\S]*?async adminLoginVerifyOtp[\s\S]*?\n  \}[\s\S]*?@Public\(\)[\s\S]*?async adminLoginResendOtp[\s\S]*?\n  \}\n/m, "");
fs.writeFileSync(path, code);
console.log("Removed dead methods from auth.controller.ts");
