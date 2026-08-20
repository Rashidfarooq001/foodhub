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

  constructor(
    private readonly prisma: PrismaService,
  ) {}

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

    const isDevOrTest = process.env.NODE_ENV !== 'production';

    // Generate unique 4-digit OTP code
    const rawOtp = Math.floor(1000 + Math.random() * 9000).toString();
    const otpHash = await bcrypt.hash(rawOtp, 10);
    const expiresAt = new Date(Date.now() + this.OTP_EXPIRY_MINS * 60 * 1000);

    await this.prisma.otp.create({
      data: {
        phone: normalizedDbPhone,
        otpHash,
        expiresAt,
      },
    });

    this.logger.log(`[OTP Gateway] Dispatched OTP for phone=${normalizedDbPhone}`);

    return {
      message: 'OTP sent successfully',
      cooldownSec: this.OTP_COOLDOWN_SEC,
      ...(isDevOrTest ? { otp: rawOtp } : {}),
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

    const isMatch = await bcrypt.compare(rawOtp, otpRecord.otpHash);
    if (!isMatch) {
      throw new BadRequestException('Invalid OTP code entered');
    }

    // Immediately mark current OTP record as used (SINGLE-USE ENFORCEMENT)
    await this.prisma.otp.update({
      where: { id: otpRecord.id },
      data: { isUsed: true },
    });

    return true;
  }


  async verifyAccessToken(accessToken: string): Promise<any> {
    if (!accessToken) {
      throw new BadRequestException('Access token is required');
    }

    // SINGLE-USE ACCESS TOKEN ENFORCEMENT: Reject previously consumed MSG91 widget tokens
    if (this.usedAccessTokens.has(accessToken)) {
      this.logger.warn(`[Backend MSG91] Access token re-use attempt rejected for token len=${accessToken.length}`);
      throw new BadRequestException('MSG91 access token has already been used. Please request a new OTP.');
    }

    const authKey = process.env.MSG91_AUTH_KEY;
    const isDevOrTest = process.env.NODE_ENV !== 'production';

    this.logger.log(`[Backend MSG91] MSG91_AUTH_KEY_PRESENT=${!!authKey}, KeyLength=${authKey?.length || 0}`);
    this.logger.log(`[Backend MSG91] Token present=${!!accessToken}, TokenLength=${accessToken.length}`);

    if ((!authKey || authKey === 'dummy_auth_key') && isDevOrTest && accessToken?.startsWith('dev_')) {
      this.logger.log('[Backend MSG91] Bypassing MSG91 API in local test mode for dev_ token');
      const devPhone = accessToken.replace('dev_widget_token_', '').replace('dev_', '');
      const formattedDevPhone = devPhone.length === 10 ? `+91${devPhone}` : (devPhone.startsWith('+') ? devPhone : `+${devPhone}`);
      
      this.usedAccessTokens.add(accessToken);
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
      this.logger.log('[Backend MSG91] Requesting https://control.msg91.com/api/v5/widget/verifyAccessToken...');
      const response = await fetch(
        'https://control.msg91.com/api/v5/widget/verifyAccessToken',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          body: JSON.stringify({
            authkey: authKey,
            'access-token': accessToken,
          }),
        },
      );

      this.logger.log(`[Backend MSG91] HTTP status from MSG91 server: ${response.status}`);
      const msg91Data = await response.json();

      if (!response.ok || msg91Data?.type === 'error' || msg91Data?.status === 'error') {
        const msg = msg91Data?.message || msg91Data?.error || 'MSG91 widget verification failed';
        this.logger.error(`[Backend MSG91] Verification rejected by MSG91 server: ${msg}`);
        throw new UnauthorizedException(`MSG91 verification rejected: ${msg}`);
      }

      // Mark token as used after successful verification
      this.usedAccessTokens.add(accessToken);
      return msg91Data;
    } catch (error: any) {
      if (error instanceof UnauthorizedException || error instanceof BadRequestException) {
        throw error;
      }
      this.logger.error(`[Backend MSG91] Exception during MSG91 verifyAccessToken: ${error?.message || error}`);
      throw new UnauthorizedException(error?.message || 'MSG91 token verification failed.');
    }
  }

  async sendDeliveryOtp(orderId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        customer: {
          include: {
            user: true,
          },
        },
      },
    });

    if (!order) {
      throw new BadRequestException('Order record not found');
    }

    if (order.status === OrderStatus.DELIVERED || order.status === OrderStatus.CANCELLED) {
      throw new BadRequestException(`Order is already ${order.status}. Delivery OTP cannot be generated.`);
    }

    const rawOtp = order.deliveryOtp && order.deliveryOtp !== 'USED'
      ? order.deliveryOtp
      : Math.floor(1000 + Math.random() * 9000).toString();

    await this.prisma.order.update({
      where: { id: orderId },
      data: {
        deliveryOtp: rawOtp,
        updatedAt: new Date(),
      },
    });

    this.logger.log(`[Delivery OTP] Order #${order.orderNumber} (${orderId}) OTP generated: ${rawOtp}`);

    // Extract customer phone
    const deliveryAddress: any = order.deliveryAddress || {};
    const rawPhone = deliveryAddress.phone || deliveryAddress.contactPhone || order.customer?.user?.phone;

    if (rawPhone) {
      const cleanDigits = rawPhone.replace(/\D/g, '');
      let mobile = cleanDigits;
      if (cleanDigits.length === 10) {
        mobile = `91${cleanDigits}`;
      } else if (cleanDigits.length === 11 && cleanDigits.startsWith('0')) {
        mobile = `91${cleanDigits.slice(1)}`;
      } else if (cleanDigits.length === 12 && cleanDigits.startsWith('91')) {
        mobile = cleanDigits;
      }

      const authKey = process.env.MSG91_AUTH_KEY;
      const flowId = process.env.MSG91_FLOW_ID || process.env.MSG91_DELIVERY_FLOW_ID;
      const templateId = process.env.MSG91_DELIVERY_TEMPLATE_ID || process.env.MSG91_OTP_TEMPLATE_ID || process.env.MSG91_TEMPLATE_ID;
      const senderId = process.env.MSG91_SENDER_ID || 'FOODHB';

      if (authKey && authKey !== 'placeholder_auth_key' && authKey !== 'dummy_auth_key') {
        try {
          if (flowId) {
            const flowPayload = {
              flow_id: flowId,
              sender: senderId,
              recipients: [
                {
                  mobiles: mobile,
                  otp: rawOtp,
                  OTP: rawOtp,
                  order: order.orderNumber,
                  ORDER: order.orderNumber,
                },
              ],
            };
            const flowRes = await fetch('https://control.msg91.com/api/v5/flow', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                authkey: authKey,
              },
              body: JSON.stringify(flowPayload),
            });
            const flowData = await flowRes.json().catch(() => ({}));
            this.logger.log(`[MSG91 Flow SMS] OTP sent to ${mobile} for Order #${order.orderNumber} (HTTP ${flowRes.status}): ${JSON.stringify(flowData)}`);
          } else {
            const otpUrl = `https://control.msg91.com/api/v5/otp?template_id=${encodeURIComponent(templateId || '')}&mobile=${mobile}&authkey=${encodeURIComponent(authKey)}&otp=${encodeURIComponent(rawOtp)}&otp_expiry=120`;
            const otpRes = await fetch(otpUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
            });
            const otpData = await otpRes.json().catch(() => ({}));
            this.logger.log(`[MSG91 OTP SMS] OTP dispatched to ${mobile} for Order #${order.orderNumber} (HTTP ${otpRes.status}): ${JSON.stringify(otpData)}`);
          }
        } catch (err: any) {
          this.logger.error(`[MSG91 Delivery OTP SMS Error] Failed to send SMS to ${mobile}: ${err?.message}`);
        }
      } else {
        // Dev/simulation mode — log OTP so tests work without real SMS credits
        this.logger.log(`[MSG91 Delivery OTP SMS Simulation] ORDER #${order.orderNumber} | Phone: ${mobile} | OTP: ${rawOtp}`);
      }
    } else {
      this.logger.warn(`[MSG91 Delivery OTP SMS] No phone found for Order #${order.orderNumber} — SMS skipped.`);
    }

    return {
      success: true,
      message: 'Delivery OTP generated and dispatched to customer mobile.',
      orderId,
    };
  }

  async verifyDeliveryOtp(orderId: string, otp: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      throw new BadRequestException('Order record not found');
    }

    if (order.status === OrderStatus.DELIVERED) {
      throw new BadRequestException('Order has already been delivered.');
    }

    if (!order.deliveryOtp || order.deliveryOtp === 'USED' || order.deliveryOtp.trim() !== otp.trim()) {
      throw new BadRequestException('Invalid or expired delivery OTP code.');
    }

    await this.prisma.order.update({
      where: { id: orderId },
      data: {
        status: OrderStatus.DELIVERED,
        deliveryOtp: 'USED',
        updatedAt: new Date(),
      },
    });

    this.logger.log(`[Delivery OTP] Order ${orderId} verified successfully. Status set to DELIVERED.`);

    return {
      success: true,
      message: 'Delivery OTP verified successfully. Order marked as DELIVERED.',
      orderId,
    };
  }
}