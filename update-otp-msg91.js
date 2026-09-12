const fs = require("fs");
const path = "apps/backend/src/modules/otp/otp.service.ts";
let code = fs.readFileSync(path, "utf8");

const oldOtpGen = `    // Generate unique 4-digit OTP code
    const rawOtp = Math.floor(1000 + Math.random() * 9000).toString();
    const otpHash = await bcrypt.hash(rawOtp, 10);`;

const newOtpGen = `    // Generate unique 4-digit OTP code cryptographically
    const crypto = require('crypto');
    const rawOtp = crypto.randomInt(1000, 10000).toString();
    const otpHash = await bcrypt.hash(rawOtp, 10);`;

code = code.replace(oldOtpGen, newOtpGen);

const oldReturn = `    this.logger.log(\`[OTP Gateway] Dispatched OTP for phone=\${normalizedDbPhone}\`);

    return {
      message: 'OTP sent successfully',
      cooldownSec: this.OTP_COOLDOWN_SEC,
      ...(isDevOrTest ? { otp: rawOtp } : {}),
    };`;

const newReturn = `    const authKey = process.env.MSG91_AUTH_KEY;
    const templateId = process.env.MSG91_TEMPLATE_ID;

    if (!authKey) {
      this.logger.error('[OTP Gateway] MSG91_AUTH_KEY missing');
      throw new BadRequestException('SMS Gateway is not configured correctly.');
    }
    if (!templateId) {
      this.logger.error('[OTP Gateway] MSG91_TEMPLATE_ID missing');
      throw new BadRequestException('SMS Template is not configured correctly.');
    }

    try {
      this.logger.log(\`[OTP Gateway] Requesting MSG91 SendOTP for \${normalizedDbPhone}...\`);
      const response = await fetch(\`https://control.msg91.com/api/v5/otp?template_id=\${templateId}&mobile=91\${cleanDigits.slice(-10)}&authkey=\${authKey}\`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ otp: rawOtp })
      });

      const msg91Data = await response.json().catch(() => ({}));
      this.logger.log(\`[OTP Gateway] MSG91 status: \${response.status}\`);

      if (!response.ok || msg91Data.type === 'error') {
        throw new Error(msg91Data.message || 'Provider rejected request');
      }
    } catch (err: any) {
      this.logger.error(\`[OTP Gateway] MSG91 SendOTP Failed: \${err.message}\`);
      // Delete the OTP record since it failed to send
      await this.prisma.otp.deleteMany({ where: { phone: normalizedDbPhone, isUsed: false } });
      throw new BadRequestException('OTP_SEND_FAILED: Unable to deliver SMS. Please try again later.');
    }

    this.logger.log(\`[OTP Gateway] Successfully dispatched OTP via MSG91 for \${normalizedDbPhone}\`);

    return {
      message: 'OTP sent successfully',
      cooldownSec: this.OTP_COOLDOWN_SEC,
      ...(isDevOrTest ? { otp: rawOtp } : {}),
    };`;

code = code.replace(oldReturn, newReturn);
fs.writeFileSync(path, code);
console.log("Updated otp.service.ts");
