import { Injectable, BadRequestException, UnauthorizedException, Logger } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { OrderStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';

@Injectable()
export class OtpService {
  private readonly logger = new Logger(OtpService.name);
  private readonly OTP_COOLDOWN_SEC = 60;
  private readonly OTP_EXPIRY_MINS = 10;
  private readonly usedAccessTokens = new Set<string>();

  private trackUsedAccessToken(token: string) {
    this.usedAccessTokens.add(token);
    if (this.usedAccessTokens.size > 10000) {
      // basic memory leak prevention
      const iterator = this.usedAccessTokens.values();
      for (let i = 0; i < 1000; i++) {
        this.usedAccessTokens.delete(iterator.next().value);
      }
    }
  }

  constructor(private readonly prisma: PrismaService) {}

  async sendOtp(phone: string): Promise<{ message: string; cooldownSec: number; otp?: string }> {
    const cleanDigits = (phone || '').replace(/\D/g, '');
    if (cleanDigits.length < 10) {
      throw new BadRequestException('Please provide a valid 10-digit mobile number');
    }
    const normalizedDbPhone = cleanDigits.length === 10 ? `+91${cleanDigits}` : `+${cleanDigits}`;

    // Check cooldown on latest request
    const existingOtp = await this.prisma.otp.findFirst({
      where: { phone: normalizedDbPhone },
      orderBy: { createdAt: 'desc' },
    });

    if (existingOtp) {
      const secondsPassed = Math.floor((Date.now() - existingOtp.createdAt.getTime()) / 1000);
      if (secondsPassed < this.OTP_COOLDOWN_SEC) {
        throw new BadRequestException(
          `Please wait ${this.OTP_COOLDOWN_SEC - secondsPassed} seconds before requesting a new OTP.`,
        );
      }
    }

    // OTP ROTATION & INVALIDATION: Immediately mark all previous unused OTPs for this phone as used/invalid
    await this.prisma.otp.updateMany({
      where: { phone: normalizedDbPhone, isUsed: false },
      data: { isUsed: true },
    });

    // Generate unique 4-digit OTP code cryptographically
    const crypto = require('crypto');
    const rawOtp = crypto.randomInt(1000, 10000).toString();
    const otpHash = await bcrypt.hash(rawOtp, 10);
    const expiresAt = new Date(Date.now() + this.OTP_EXPIRY_MINS * 60 * 1000);

    await this.prisma.otp.create({
      data: {
        phone: normalizedDbPhone,
        otpHash,
        expiresAt,
      },
    });

    const authKey = process.env.MSG91_AUTH_KEY;

    if (!authKey) {
      this.logger.error('[OTP Gateway] MSG91_AUTH_KEY missing');
      // Cleanup the stored OTP before throwing
      await this.prisma.otp.deleteMany({ where: { phone: normalizedDbPhone, isUsed: false } });
      throw new BadRequestException('SMS Gateway is not configured correctly.');
    }

    const mobileFor91 = `91${cleanDigits.slice(-10)}`;
    const msg91Url = `https://api.msg91.com/api/v5/otp?authkey=${authKey}&mobile=${mobileFor91}&otp=${rawOtp}`;

    try {
      this.logger.log(`[OTP Gateway] Requesting MSG91 SendOTP for mobile ending ...${cleanDigits.slice(-4)}...`);
      const response = await fetch(msg91Url, { method: 'GET' });
      const msg91Data = await response.json().catch(() => ({}));
      this.logger.log(`[OTP Gateway] MSG91 HTTP status: ${response.status}, type: ${msg91Data?.type}`);

      if (!response.ok || msg91Data?.type === 'error') {
        throw new Error(msg91Data?.message || 'Provider rejected request');
      }
    } catch (err: any) {
      this.logger.error(`[OTP Gateway] MSG91 SendOTP Failed: ${err.message}`);
      // Delete the OTP record since it failed to send — do NOT authenticate
      await this.prisma.otp.deleteMany({ where: { phone: normalizedDbPhone, isUsed: false } });
      throw new BadRequestException('OTP_SEND_FAILED: Unable to deliver SMS. Please try again later.');
    }

    this.logger.log(`[OTP Gateway] Successfully dispatched OTP via MSG91 for mobile ending ...${cleanDigits.slice(-4)}`);

    return {
      message: 'OTP sent successfully',
      cooldownSec: this.OTP_COOLDOWN_SEC,
    };
  }

  async verifyOtp(phone: string, rawOtp: string): Promise<boolean> {
    const cleanDigits = (phone || '').replace(/\D/g, '');
    const normalizedDbPhone = cleanDigits.length === 10 ? `+91${cleanDigits}` : `+${cleanDigits}`;

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
  }

  async verifyAccessToken(accessToken: string): Promise<any> {
    if (!accessToken) {
      throw new BadRequestException('Access token is required');
    }

    // SINGLE-USE ACCESS TOKEN ENFORCEMENT: Reject previously consumed MSG91 widget tokens
    if (this.usedAccessTokens.has(accessToken)) {
      this.logger.warn(
        `[Backend MSG91] Access token re-use attempt rejected for token len=${accessToken.length}`,
      );
      throw new BadRequestException(
        'MSG91 access token has already been used. Please request a new OTP.',
      );
    }

    const authKey = process.env.MSG91_AUTH_KEY;
    const isDevOrTest = process.env.NODE_ENV !== 'production';

    this.logger.log(
      `[Backend MSG91] MSG91_AUTH_KEY_PRESENT=${!!authKey}, KeyLength=${authKey?.length || 0}`,
    );
    this.logger.log(
      `[Backend MSG91] Token present=${!!accessToken}, TokenLength=${accessToken.length}`,
    );

    if (
      (!authKey || authKey === 'dummy_auth_key') &&
      isDevOrTest &&
      accessToken?.startsWith('dev_')
    ) {
      this.logger.log('[Backend MSG91] Bypassing MSG91 API in local test mode for dev_ token');
      const devPhone = accessToken.replace('dev_widget_token_', '').replace('dev_', '');
      const formattedDevPhone =
        devPhone.length === 10
          ? `+91${devPhone}`
          : devPhone.startsWith('+')
            ? devPhone
            : `+${devPhone}`;

      this.trackUsedAccessToken(accessToken);
      return {
        type: 'success',
        message: formattedDevPhone || '919876543210',
      };
    }

    if (!authKey) {
      this.logger.error('[Backend MSG91] MSG91_AUTH_KEY is missing in environment variables!');
      throw new UnauthorizedException('Server configuration error: MSG91_AUTH_KEY missing');
    }

    try {
      this.logger.log(
        '[Backend MSG91] Requesting https://control.msg91.com/api/v5/widget/verifyAccessToken...',
      );
      const response = await fetch('https://control.msg91.com/api/v5/widget/verifyAccessToken', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          authkey: authKey,
          'access-token': accessToken,
        }),
      });

      this.logger.log(`[Backend MSG91] HTTP status from MSG91 server: ${response.status}`);
      const msg91Data = await response.json();

      if (!response.ok || msg91Data?.type === 'error' || msg91Data?.status === 'error') {
        const msg = msg91Data?.message || msg91Data?.error || 'MSG91 widget verification failed';
        this.logger.error(`[Backend MSG91] Verification rejected by MSG91 server: ${msg}`);
        throw new UnauthorizedException(`MSG91 verification rejected: ${msg}`);
      }

      // Mark token as used after successful verification
      this.trackUsedAccessToken(accessToken);
      return msg91Data;
    } catch (error: any) {
      if (error instanceof UnauthorizedException || error instanceof BadRequestException) {
        throw error;
      }
      this.logger.error(
        `[Backend MSG91] Exception during MSG91 verifyAccessToken: ${error?.message || error}`,
      );
      throw new UnauthorizedException(error?.message || 'MSG91 token verification failed.');
    }
  }
}
