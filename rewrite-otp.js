const fs = require('fs');
const file = 'apps/backend/src/modules/otp/otp.service.ts';
let content = fs.readFileSync(file, 'utf8');

const verifyOtpRegex = /async verifyOtp\(phone: string, rawOtp: string\): Promise<boolean> \{[\s\S]*?return true;\n  \}/;

const newVerifyOtp = `async verifyOtp(phone: string, rawOtp: string): Promise<boolean> {
    const cleanDigits = (phone || '').replace(/\\D/g, '');
    const normalizedDbPhone = cleanDigits.length === 10 ? \`+91\${cleanDigits}\` : \`+\${cleanDigits}\`;

    const otpRecord = await this.prisma.otp.findFirst({
      where: { phone: normalizedDbPhone, isUsed: false },
      orderBy: { createdAt: 'desc' },
    });

    if (!otpRecord) {
      throw new BadRequestException('No active OTP request found for this phone number');
    }

    if (new Date() > otpRecord.expiresAt) {
      throw new BadRequestException('OTP code has expired. Please request a new code.');
    }

    if (otpRecord.attempts >= 5) {
      // Mark blocked
      await this.prisma.otp.update({ where: { id: otpRecord.id }, data: { isUsed: true } });
      throw new BadRequestException('Too many invalid attempts. This OTP has been blocked. Please request a new one.');
    }

    const isMatch = await bcrypt.compare(rawOtp, otpRecord.otpHash);
    
    if (!isMatch) {
      await this.prisma.otp.update({
        where: { id: otpRecord.id },
        data: { attempts: { increment: 1 } },
      });
      throw new BadRequestException('Invalid OTP code entered');
    }

    // Immediately mark current OTP record as used (SINGLE-USE ENFORCEMENT - ATOMIC)
    const updateRes = await this.prisma.otp.updateMany({
      where: { id: otpRecord.id, isUsed: false },
      data: { isUsed: true },
    });

    if (updateRes.count === 0) {
      throw new BadRequestException('OTP was already used concurrently.');
    }

    return true;
  }`;

content = content.replace(verifyOtpRegex, newVerifyOtp);

// Fix memory leak on usedAccessTokens
const verifyAccessRegex = /this\.usedAccessTokens\.has\(accessToken\)[\s\S]*?this\.usedAccessTokens\.add\(accessToken\);/g;

// Instead of rewriting verifyAccessToken heavily, I will just add an eviction logic or rely on the fact that MSG91 rejects it.
// Let's just wrap it. We can add a simple LRU logic in memory:
const classStart = /private readonly usedAccessTokens = new Set<string>\(\);/;
const lruImpl = `private readonly usedAccessTokens = new Set<string>();

  private trackUsedAccessToken(token: string) {
    this.usedAccessTokens.add(token);
    if (this.usedAccessTokens.size > 10000) {
      // basic memory leak prevention
      const iterator = this.usedAccessTokens.values();
      for (let i = 0; i < 1000; i++) {
        this.usedAccessTokens.delete(iterator.next().value);
      }
    }
  }`;
content = content.replace(classStart, lruImpl);

content = content.replace(/this\.usedAccessTokens\.add\(accessToken\);/g, 'this.trackUsedAccessToken(accessToken);');

fs.writeFileSync(file, content);
console.log("Rewrote otp.service.ts securely.");
