const fs = require("fs");
const path = "/root/zayka-backend/src/modules/auth/auth.controller.ts";
let code = fs.readFileSync(path, "utf8");
code = code.replace(/@Post\('admin\/login\/verify-otp'\)/g, "@Public()\n  @Post('admin/login/verify-otp')");
code = code.replace(/@Post\('admin\/login\/resend-otp'\)/g, "@Public()\n  @Post('admin/login/resend-otp')");
fs.writeFileSync(path, code);
console.log("Patched auth.controller.ts on VPS");
