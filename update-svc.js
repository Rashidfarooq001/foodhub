const fs = require("fs");
const path = "apps/backend/src/modules/auth/auth.service.ts";
let code = fs.readFileSync(path, "utf8");

const targetStr = `    const adminUser = authenticatedAdmin;

    // 5. Authenticate Admin session & issue JWT token pair
    this.logger.log(
      \`[Admin Two-Password Auth] Successful login for Admin ID=${adminUser.id}, role=${adminUser.role}\`,
    );
    const session = await this.sessionService.createSession(adminUser.id, ipAddress, userAgent);
    const tokens = await this.tokenService.generateTokenPair(
      {
        id: adminUser.id,
        phone: adminUser.phone,
        role: adminUser.role || UserRole.SUPER_ADMIN,
      },
      session.id,
    );

    return {
      user: {
        id: adminUser.id,
        phone: adminUser.phone,
        email: adminUser.email,
        role: adminUser.role || UserRole.SUPER_ADMIN,
        profile: adminUser.profile,
      },
      tokens: {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
      },
    };
  }`;

const newStr = `    const adminUser = authenticatedAdmin;

    // 5. Generate preAuthToken and send OTP
    this.logger.log(\`[Admin Two-Password Auth] Passwords matched for Admin ID=${adminUser.id}. Dispatching OTP...\`);
    const preAuthToken = await this.tokenService.jwtService.signAsync(
      { adminId: adminUser.id, type: 'pre-auth' },
      { expiresIn: '5m' }
    );
    await this.otpService.sendOtp(adminUser.phone);
    return {
      preAuthToken,
      maskedPhone: '******' + adminUser.phone.slice(-4)
    };
  }

  async adminTwoPasswordVerifyOtp(dto: any, ipAddress?: string, userAgent?: string) {
    const payload = await this.tokenService.jwtService.verifyAsync(dto.preAuthToken).catch(() => null);
    if (!payload || payload.type !== 'pre-auth') throw new UnauthorizedException('Invalid or expired preAuthToken');
    const adminUser = await (this.usersService as any).prisma.user.findUnique({ where: { id: payload.adminId }, include: { profile: true } });
    if (!adminUser) throw new UnauthorizedException('Admin not found');
    await this.otpService.verifyOtp(adminUser.phone, dto.otp);
    
    const session = await this.sessionService.createSession(adminUser.id, ipAddress, userAgent);
    const tokens = await this.tokenService.generateTokenPair(
      { id: adminUser.id, phone: adminUser.phone, role: adminUser.role }, session.id
    );
    return {
      user: { id: adminUser.id, phone: adminUser.phone, email: adminUser.email, role: adminUser.role, profile: adminUser.profile },
      tokens: { accessToken: tokens.accessToken, refreshToken: tokens.refreshToken }
    };
  }

  async adminTwoPasswordResendOtp(dto: any) {
    const payload = await this.tokenService.jwtService.verifyAsync(dto.preAuthToken).catch(() => null);
    if (!payload || payload.type !== 'pre-auth') throw new UnauthorizedException('Invalid or expired preAuthToken');
    const adminUser = await (this.usersService as any).prisma.user.findUnique({ where: { id: payload.adminId } });
    await this.otpService.sendOtp(adminUser.phone);
    return { success: true };
  }`;

if (code.includes(targetStr)) {
  fs.writeFileSync(path, code.replace(targetStr, newStr));
  console.log("Replaced svc successfully");
} else {
  console.log("Target string svc not found!");
}
