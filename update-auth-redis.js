const fs = require("fs");
const path = "apps/backend/src/modules/auth/auth.service.ts";
let code = fs.readFileSync(path, "utf8");

// Replace adminTwoPasswordLogin preAuthToken logic
const oldPreAuth = `    const preAuthToken = await this.tokenService.jwtService.signAsync(
      { adminId: adminUser.id, type: 'pre-auth' },
      { expiresIn: '5m' }
    );`;

const newPreAuth = `    const preAuthToken = import_crypto.randomUUID();
    await this.redisService.getClient().setex(\`admin_pre_auth:\${preAuthToken}\`, 300, JSON.stringify({ adminId: adminUser.id }));`;
    
code = code.replace(oldPreAuth, newPreAuth);
code = code.replace('import_crypto', "require('crypto')");

// Replace adminTwoPasswordVerifyOtp logic
const oldVerify = `  async adminTwoPasswordVerifyOtp(dto: any, ipAddress?: string, userAgent?: string) {
    const payload = await this.tokenService.jwtService.verifyAsync(dto.preAuthToken).catch(() => null);
    if (!payload || payload.type !== 'pre-auth') throw new UnauthorizedException('Invalid or expired preAuthToken');`;

const newVerify = `  async adminTwoPasswordVerifyOtp(dto: any, ipAddress?: string, userAgent?: string) {
    const rawPayload = await this.redisService.getClient().get(\`admin_pre_auth:\${dto.preAuthToken}\`);
    if (!rawPayload) throw new UnauthorizedException('Invalid or expired preAuthToken');
    const payload = JSON.parse(rawPayload);
    await this.redisService.getClient().del(\`admin_pre_auth:\${dto.preAuthToken}\`);`;

code = code.replace(oldVerify, newVerify);

// Replace adminTwoPasswordResendOtp logic
const oldResend = `  async adminTwoPasswordResendOtp(dto: any) {
    const payload = await this.tokenService.jwtService.verifyAsync(dto.preAuthToken).catch(() => null);
    if (!payload || payload.type !== 'pre-auth') throw new UnauthorizedException('Invalid or expired preAuthToken');`;

const newResend = `  async adminTwoPasswordResendOtp(dto: any) {
    const rawPayload = await this.redisService.getClient().get(\`admin_pre_auth:\${dto.preAuthToken}\`);
    if (!rawPayload) throw new UnauthorizedException('Invalid or expired preAuthToken');
    const payload = JSON.parse(rawPayload);`;
    
code = code.replace(oldResend, newResend);

fs.writeFileSync(path, code);
console.log("Updated auth.service.ts");
