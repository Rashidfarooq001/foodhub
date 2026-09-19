const fs = require('fs');
let content = fs.readFileSync('apps/backend/src/modules/otp/otp.service.ts', 'utf8');

const targetSend = `    const msg91Url = \`https://api.msg91.com/api/v5/otp?authkey=\${authKey}&mobile=\${mobileFor91}&otp=\${rawOtp}\`;`;
const replaceSend = `    // We omit &otp=\${rawOtp} so MSG91 generates its own OTP via its default template
    const msg91Url = \`https://api.msg91.com/api/v5/otp?authkey=\${authKey}&mobile=\${mobileFor91}\`;`;
content = content.split(targetSend).join(replaceSend);

const targetVerify = `    const normalizedDbPhone = cleanDigits.length === 10 ? \`+91\${cleanDigits}\` : \`+\${cleanDigits}\`;

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
      throw new BadRequestException('Invalid OTP');
    }

    // Mark used
    await this.prisma.otp.update({
      where: { id: otpRecord.id },
      data: { isUsed: true },
    });

    return true;`;

const replaceVerify = `    const mobileFor91 = \`91\${cleanDigits.slice(-10)}\`;
    const authKey = process.env.MSG91_AUTH_KEY;
    const verifyUrl = \`https://api.msg91.com/api/v5/otp/verify?authkey=\${authKey}&mobile=\${mobileFor91}&otp=\${rawOtp}\`;

    if (!authKey) {
      throw new BadRequestException('SMS Gateway is not configured correctly.');
    }

    try {
      const response = await fetch(verifyUrl, { method: 'GET' });
      const msg91Data = await response.json();
      
      if (msg91Data?.type === 'error') {
        throw new BadRequestException(msg91Data.message || 'Invalid OTP');
      }
    } catch (err: any) {
      if (err instanceof BadRequestException) throw err;
      throw new BadRequestException('OTP Verification Failed. Please try again.');
    }

    return true;`;
content = content.split(targetVerify).join(replaceVerify);

fs.writeFileSync('apps/backend/src/modules/otp/otp.service.ts', content);
