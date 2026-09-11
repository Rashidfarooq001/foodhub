const fs = require("fs");
const path = "/root/zayka-backend/src/modules/auth/auth.service.ts";
let code = fs.readFileSync(path, "utf8");
code = code.replace(
  /\/\/\ 5\.\ Generate preAuthToken[\s\S]*?return \{\s*preAuthToken,\s*maskedPhone: '.*'\ \+\ adminUser\.phone\.slice\(-4\)\s*\};\s*\}/m,
  `const session = await this.sessionService.createSession(adminUser.id, ipAddress, userAgent);
    const tokens = await this.tokenService.generateTokenPair(
      { id: adminUser.id, phone: adminUser.phone, role: adminUser.role }, session.id
    );
    
    return {
      user: { id: adminUser.id, phone: adminUser.phone, email: adminUser.email, role: adminUser.role, profile: adminUser.profile },
      tokens: { accessToken: tokens.accessToken, refreshToken: tokens.refreshToken }
    };
  }`
);
fs.writeFileSync(path, code);
console.log("Patched auth.service.ts on VPS");
