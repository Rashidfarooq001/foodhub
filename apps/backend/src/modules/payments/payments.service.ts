import {
  Injectable,
  BadRequestException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { VerifyPaymentDto } from './dto/verify-payment.dto';
import { PaymentStatus } from '@prisma/client';
import * as crypto from 'crypto';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const Razorpay = require('razorpay');

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  private readonly razorpay = new Razorpay({
    key_id:     process.env['RAZORPAY_KEY_ID']     ?? 'rzp_test_placeholder',
    key_secret: process.env['RAZORPAY_KEY_SECRET'] ?? 'placeholder_secret',
  });

  constructor(private readonly prisma: PrismaService) {}

  /** Create a Razorpay order and store a Payment record */
  async createPaymentOrder(dto: CreatePaymentDto) {
    const order = await this.prisma.order.findUnique({
      where: { id: dto.orderId },
    });
    if (!order) throw new NotFoundException('Order not found');

    // Idempotency: return existing payment if already initiated
    const existing = await this.prisma.payment.findFirst({
      where: { orderId: dto.orderId, status: PaymentStatus.PENDING },
    });
    if (existing) return { razorpayOrderId: existing.razorpayOrderId };

    // Amount in paise (Razorpay uses smallest currency unit)
    const amountPaise = Math.round(dto.amount * 100);

    const rzpOrder = await this.razorpay.orders.create({
      amount:   amountPaise,
      currency: 'INR',
      receipt:  order.orderNumber,
    });

    const payment = await this.prisma.payment.create({
      data: {
        orderId:          dto.orderId,
        razorpayOrderId:  rzpOrder.id,
        amount:           dto.amount,
        status:           PaymentStatus.PENDING,
        method:           dto.method,
      },
    });

    this.logger.log(`Payment order created: ${rzpOrder.id} for Order ${dto.orderId}`);
    return { razorpayOrderId: rzpOrder.id, paymentId: payment.id };
  }

  /** Verify HMAC-SHA256 signature and mark payment complete */
  async verifyPayment(dto: VerifyPaymentDto) {
    const secret = process.env['RAZORPAY_KEY_SECRET'] ?? 'placeholder_secret';
    const body   = `${dto.razorpayOrderId}|${dto.razorpayPaymentId}`;
    const expectedSig = crypto
      .createHmac('sha256', secret)
      .update(body)
      .digest('hex');

    if (expectedSig !== dto.razorpaySignature) {
      throw new BadRequestException('Payment signature verification failed');
    }

    const payment = await this.prisma.payment.findUnique({
      where: { razorpayOrderId: dto.razorpayOrderId },
    });
    if (!payment) throw new NotFoundException('Payment record not found');

    // Idempotency: skip if already verified
    if (payment.status === PaymentStatus.COMPLETED) {
      return { message: 'Payment already verified', orderId: payment.orderId };
    }

    await this.prisma.$transaction([
      this.prisma.payment.update({
        where: { id: payment.id },
        data:  {
          razorpayPaymentId: dto.razorpayPaymentId,
          razorpaySignature: dto.razorpaySignature,
          status:            PaymentStatus.COMPLETED,
        },
      }),
      this.prisma.order.update({
        where: { id: payment.orderId },
        data:  { paymentStatus: PaymentStatus.COMPLETED },
      }),
    ]);

    this.logger.log(`Payment verified: ${dto.razorpayPaymentId}`);
    return { message: 'Payment verified successfully', orderId: payment.orderId };
  }

  /** Handle Razorpay webhooks with signature verification */
  async handleWebhook(
    body:      Record<string, unknown>,
    signature: string,
    rawBody:   string,
  ) {
    const secret = process.env['RAZORPAY_WEBHOOK_SECRET'] ?? 'webhook_secret';
    const expectedSig = crypto
      .createHmac('sha256', secret)
      .update(rawBody)
      .digest('hex');

    if (expectedSig !== signature) {
      throw new BadRequestException('Invalid webhook signature');
    }

    const event   = body['event'] as string;
    const payload = body['payload'] as Record<string, unknown>;

    this.logger.log(`Webhook received: ${event}`);

    switch (event) {
      case 'payment.captured':
        await this.handlePaymentCaptured(payload);
        break;
      case 'payment.failed':
        await this.handlePaymentFailed(payload);
        break;
      case 'refund.processed':
        await this.handleRefundProcessed(payload);
        break;
      default:
        this.logger.warn(`Unhandled webhook event: ${event}`);
    }

    return { received: true };
  }

  /** Initiate a Razorpay refund for an order */
  async initiateRefund(orderId: string, reason: string) {
    const payment = await this.prisma.payment.findFirst({
      where:   { orderId, status: PaymentStatus.COMPLETED },
      include: { refunds: true },
    });
    if (!payment) throw new NotFoundException('No completed payment for this order');

    if (payment.refunds.length > 0) {
      throw new BadRequestException('Refund already initiated for this order');
    }

    const rzpRefund = await this.razorpay.payments.refund(
      payment.razorpayPaymentId!,
      { amount: Math.round(Number(payment.amount) * 100) },
    );

    await this.prisma.paymentRefund.create({
      data: {
        paymentId:       payment.id,
        razorpayRefundId: rzpRefund.id,
        amount:          payment.amount,
      },
    });

    await this.prisma.order.update({
      where: { id: orderId },
      data:  { paymentStatus: PaymentStatus.REFUNDED },
    });

    this.logger.log(`Refund initiated: ${rzpRefund.id} for Order ${orderId}`);
    return { message: 'Refund initiated', refundId: rzpRefund.id };
  }

  private async handlePaymentCaptured(payload: Record<string, unknown>) {
    const payment = (payload['payment'] as any)?.entity;
    if (payment?.order_id) {
      await this.prisma.payment.updateMany({
        where: { razorpayOrderId: payment.order_id },
        data:  { status: PaymentStatus.COMPLETED },
      });
    }
  }

  private async handlePaymentFailed(payload: Record<string, unknown>) {
    const payment = (payload['payment'] as any)?.entity;
    if (payment?.order_id) {
      await this.prisma.payment.updateMany({
        where: { razorpayOrderId: payment.order_id },
        data:  { status: PaymentStatus.FAILED },
      });
    }
  }

  private async handleRefundProcessed(payload: Record<string, unknown>) {
    const refund = (payload['refund'] as any)?.entity;
    this.logger.log(`Refund processed by Razorpay: ${refund?.id}`);
  }
}
