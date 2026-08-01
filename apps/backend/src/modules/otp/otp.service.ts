import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class OtpService {
  private readonly logger = new Logger(OtpService.name);
  private readonly OTP_COOLDOWN_SEC = 60;
  private readonly OTP_EXPIRY_MINS = 10;

  constructor(
    private readonly prisma: PrismaService,
    private readonly http: HttpService,
    private readonly config: ConfigService,
  ) {}

  async sendOtp(phone: string): Promise<{ message: string; cooldownSec: number; otp?: string }> {
    const formattedPhone = phone.startsWith('+') ? phone : (phone.length === 10 ? `+91${phone}` : `+${phone}`);
    const cleanMobile = formattedPhone.replace(/\D/g, '');

    // Check cooldown
    const existingOtp = await this.prisma.otp.findFirst({
      where: { phone: formattedPhone, isUsed: false },
      orderBy: { createdAt: 'desc' },
    });

    if (existingOtp) {
      const timeDiffSec = (Date.now() - existingOtp.createdAt.getTime()) / 1000;
      if (timeDiffSec < this.OTP_COOLDOWN_SEC) {
        const remainingCooldown = Math.ceil(this.OTP_COOLDOWN_SEC - timeDiffSec);
        throw new BadRequestException(`Please wait ${remainingCooldown} seconds before requesting another OTP`);
      }
    }

    const authKey = this.config.get<string>('MSG91_AUTH_KEY') || process.env.MSG91_AUTH_KEY;
    const templateId = this.config.get<string>('MSG91_TEMPLATE_ID') || process.env.MSG91_TEMPLATE_ID || '669145dcd640490b4d4cf5f2';

    const maskedKey = authKey ? `${authKey.substring(0, 4)}****${authKey.substring(authKey.length - 4)}` : 'NOT_SET';
    this.logger.log(`[MSG91 Auth Check] MSG91_AUTH_KEY loaded: ${authKey ? `YES (${maskedKey})` : 'NO'}`);
    this.logger.log(`[MSG91 Auth Check] MSG91_TEMPLATE_ID loaded: ${templateId ? `YES (${templateId})` : 'NO'}`);

    const isTest = process.env.NODE_ENV === 'test' || authKey === 'dummy_auth_key';

    // Generate local 4-digit OTP for DB record
    const rawOtp = isTest ? '4819' : Math.floor(1000 + Math.random() * 9000).toString();
    const otpHash = await bcrypt.hash(rawOtp, 10);
    const expiresAt = new Date(Date.now() + this.OTP_EXPIRY_MINS * 60 * 1000);

    await this.prisma.otp.create({
      data: {
        phone: formattedPhone,
        otpHash,
        expiresAt,
      },
    });

    // If authKey is present and valid, execute MSG91 REST API call
    if (authKey && authKey !== 'dummy_auth_key' && !isTest) {
      if (!templateId) {
        throw new BadRequestException('MSG91_TEMPLATE_ID environment variable is missing on backend server');
      }

      const url = `https://control.msg91.com/api/v5/otp?template_id=${templateId}&mobile=${cleanMobile}&authkey=${authKey}`;
      const payload = { template_id: templateId, mobile: cleanMobile };

      this.logger.log(`[MSG91 SendOTP Request URL] ${url}`);
      this.logger.log(`[MSG91 SendOTP Request Payload] ${JSON.stringify(payload)}`);

      try {
        const response = await firstValueFrom(
          this.http.post(url, payload, {
            headers: {
              'Content-Type': 'application/json',
              authkey: authKey,
            },
          }),
        );

        this.logger.log(`[MSG91 SendOTP Response] Status: ${response.status}, Data: ${JSON.stringify(response.data)}`);

        const resData = response.data;
        if (resData.type === 'error' || resData.status === 'error') {
          throw new BadRequestException(resData.message || 'MSG91 failed to send OTP SMS');
        }
      } catch (error: any) {
        if (error instanceof BadRequestException) {
          throw error;
        }

        const errStatus = error?.response?.status;
        const errData = JSON.stringify(error?.response?.data || {});
        const errMsg = error?.message;

        this.logger.error(`[MSG91 SendOTP Axios Error] Status: ${errStatus}, Data: ${errData}, Message: ${errMsg}`);

        throw new BadRequestException(
          error?.response?.data?.message || `MSG91 OTP SMS dispatch failed: ${errMsg || 'HTTP Error'}`,
        );
      }
    } else {
      this.logger.log(`[Dev/Test SMS Suppressed] Local OTP generated for ${formattedPhone}: ${rawOtp}`);
    }

    return {
      message: 'OTP sent successfully',
      cooldownSec: this.OTP_COOLDOWN_SEC,
      ...(isTest ? { otp: rawOtp } : {}),
    };
  }

  async verifyOtp(phone: string, rawOtp: string): Promise<boolean> {
    const formattedPhone = phone.startsWith('+') ? phone : (phone.length === 10 ? `+91${phone}` : `+${phone}`);
    const cleanMobile = formattedPhone.replace(/\D/g, '');

    const authKey = this.config.get<string>('MSG91_AUTH_KEY') || process.env.MSG91_AUTH_KEY;
    const isTest = process.env.NODE_ENV === 'test' || authKey === 'dummy_auth_key';

    // 1. Attempt MSG91 REST API verification if live authKey exists
    if (authKey && authKey !== 'dummy_auth_key' && !isTest) {
      try {
        const url = `https://control.msg91.com/api/v5/otp/verify?otp=${encodeURIComponent(rawOtp)}&mobile=${encodeURIComponent(cleanMobile)}`;
        this.logger.log(`[MSG91 VerifyOTP Request URL] ${url}`);

        const response = await firstValueFrom(
          this.http.get(url, {
            headers: {
              authkey: authKey,
            },
          }),
        );

        const resData = response.data;
        this.logger.log(`[MSG91 VerifyOTP Response] Status: ${response.status}, Data: ${JSON.stringify(resData)}`);

        if (resData.type === 'success' || resData.message?.toLowerCase().includes('success')) {
          return true;
        } else if (resData.type === 'error') {
          throw new BadRequestException(resData.message || 'Invalid or expired OTP code');
        }
      } catch (err: any) {
        if (err instanceof BadRequestException) throw err;

        const errStatus = err?.response?.status;
        const errData = JSON.stringify(err?.response?.data || {});
        const errMsg = err?.message;

        this.logger.error(`[MSG91 VerifyOTP Axios Error] Status: ${errStatus}, Data: ${errData}, Message: ${errMsg}`);
        throw new BadRequestException(err?.response?.data?.message || 'Invalid or expired OTP code');
      }
    }

    // 2. Local DB verification fallback (for unit tests or offline dev)
    const otpRecord = await this.prisma.otp.findFirst({
      where: { phone: formattedPhone, isUsed: false },
      orderBy: { createdAt: 'desc' },
    });

    if (!otpRecord) {
      throw new BadRequestException('No active OTP request found for this phone number');
    }

    if (new Date() > otpRecord.expiresAt) {
      throw new BadRequestException('OTP has expired. Please request a new one');
    }

    const isValid = await bcrypt.compare(rawOtp, otpRecord.otpHash);
    if (!isValid) {
      throw new BadRequestException('Invalid OTP code entered');
    }

    await this.prisma.otp.update({
      where: { id: otpRecord.id },
      data: { isUsed: true },
    });

    return true;
  }
}