import { Injectable, BadRequestException, UnauthorizedException, Logger } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { RedisService } from '../redis/redis.service';
import { normalizeIndianPhone } from '@foodhub/utils';

const TEST_PHONE_DIGITS = '9999999999';
const TEST_OTP = '1234';

@Injectable()
export class OtpService {
  private readonly logger = new Logger(OtpService.name);
  private readonly OTP_COOLDOWN_SEC = 60;
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

  constructor(
    private readonly prisma: PrismaService,
    private readonly redisService: RedisService,
  ) {}

  // ──────────────────────────────────────────
  // SEND OTP
  // ──────────────────────────────────────────
  async sendOtp(phone: string): Promise<{ message: string; cooldownSec: number }> {
    const cleanDigits = (phone || '').replace(/\D/g, '');
    if (cleanDigits.length < 10) {
      throw new BadRequestException('Please provide a valid 10-digit mobile number');
    }

    const last10 = cleanDigits.slice(-10);
    const mobileFor91 = `91${last10}`;

    // ── TEST BYPASS (only for hardcoded test phone) ──
    if (cleanDigits === TEST_PHONE_DIGITS && process.env.ENABLE_TEST_BYPASS === 'true') {
      this.logger.log(`[OTP Gateway] TEST BYPASS: Skipping MSG91 for test phone ...${TEST_PHONE_DIGITS.slice(-4)}`);
      // Store test OTP in Redis so verifyOtp works in test mode too
      const otpKey = `otp_code:${last10}`;
      await this.redisService.getClient().setex(otpKey, 600, TEST_OTP);
      return { message: 'OTP sent successfully', cooldownSec: this.OTP_COOLDOWN_SEC };
    }

    // ── COOLDOWN CHECK (Redis) ──
    const cooldownKey = `otp_cooldown:${last10}`;
    const ttl = await this.redisService.getClient().ttl(cooldownKey);
    if (ttl > 0) {
      throw new BadRequestException(
        `Please wait ${ttl} seconds before requesting a new OTP.`,
      );
    }

    const authKey = process.env.MSG91_AUTH_KEY;
    if (!authKey) {
      this.logger.error('[OTP Gateway] MSG91_AUTH_KEY missing');
      throw new BadRequestException('SMS Gateway is not configured correctly.');
    }

    // ── Generate 6-digit OTP and store in Redis (10 min TTL) ──
    const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpKey = `otp_code:${last10}`;
    await this.redisService.getClient().setex(otpKey, 600, generatedOtp);

    // ── MSG91 SendOTP — pass our generated OTP so MSG91 delivers it via SMS ──
    const msg91Url = `https://api.msg91.com/api/v5/otp?authkey=${authKey}&mobile=${mobileFor91}&otp=${generatedOtp}`;

    try {
      this.logger.log(`[OTP Gateway] Requesting MSG91 SendOTP for mobile ending ...${last10.slice(-4)}`);
      const response = await fetch(msg91Url, { method: 'GET' });
      const msg91Data = await response.json().catch(() => ({}));
      this.logger.log(`[OTP Gateway] MSG91 HTTP status: ${response.status}, type: ${msg91Data?.type}`);

      if (!response.ok || msg91Data?.type === 'error') {
        // Clear the stored OTP on send failure so it can't be guessed
        await this.redisService.getClient().del(otpKey);
        throw new Error(msg91Data?.message || 'Provider rejected request');
      }
    } catch (err: any) {
      this.logger.error(`[OTP Gateway] MSG91 SendOTP Failed: ${err.message}`);
      throw new BadRequestException('OTP_SEND_FAILED: Unable to deliver SMS. Please try again later.');
    }

    // ── Set cooldown in Redis ──
    await this.redisService.getClient().setex(cooldownKey, this.OTP_COOLDOWN_SEC, '1');

    this.logger.log(`[OTP Gateway] Successfully dispatched OTP via MSG91 for mobile ending ...${last10.slice(-4)}`);

    return {
      message: 'OTP sent successfully',
      cooldownSec: this.OTP_COOLDOWN_SEC,
    };
  }

  // ──────────────────────────────────────────
  // VERIFY OTP  (checks Redis — bypasses MSG91 verify API which rejects our authkey)
  // ──────────────────────────────────────────
  async verifyOtp(phone: string, rawOtp: string): Promise<boolean> {
    const cleanDigits = (phone || '').replace(/\D/g, '');
    const last10 = cleanDigits.slice(-10);

    // ── TEST BYPASS ──
    if (
      cleanDigits === TEST_PHONE_DIGITS &&
      rawOtp === TEST_OTP &&
      process.env.ENABLE_TEST_BYPASS === 'true'
    ) {
      this.logger.log(`[OTP Gateway] TEST BYPASS: Skipping verify for test phone ...${last10.slice(-4)}`);
      return true;
    }

    const otpKey = `otp_code:${last10}`;
    const storedOtp = await this.redisService.getClient().get(otpKey);

    if (!storedOtp) {
      this.logger.warn(`[OTP Gateway] No OTP found in Redis for mobile ending ...${last10.slice(-4)}. Expired or never sent.`);
      throw new BadRequestException('OTP has expired or was never requested. Please request a new OTP.');
    }

    if (storedOtp.trim() !== (rawOtp || '').trim()) {
      this.logger.warn(`[OTP Gateway] OTP mismatch for mobile ending ...${last10.slice(-4)}`);
      throw new BadRequestException('Invalid OTP. Please check and try again.');
    }

    // ── Single-use: delete OTP from Redis after successful verification ──
    await this.redisService.getClient().del(otpKey);

    this.logger.log(`[OTP Gateway] OTP verified successfully via Redis for mobile ending ...${last10.slice(-4)}`);
    return true;
  }


  // ──────────────────────────────────────────
  // VERIFY MSG91 WIDGET ACCESS TOKEN
  // ──────────────────────────────────────────
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
