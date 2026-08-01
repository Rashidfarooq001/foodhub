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
  private readonly razorpay: any;

  constructor(private readonly prisma: PrismaService) {
    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!keyId || !keySecret) {
      throw new Error(
        'RAZORPAY_KEY_ID or RAZORPAY_KEY_SECRET is missing.',
      );
    }

    this.razorpay = new Razorpay({
      key_id: keyId,
      key_secret: keySecret,
    });
  }

  /**
   * Create Razorpay Order
   */
  async createPaymentOrder(dto: CreatePaymentDto) {
    const order = await this.prisma.order.findUnique({
      where: {
        id: dto.orderId,
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    let paymentAmount = Number(dto.amount);

    if (!paymentAmount || paymentAmount <= 0) {
      paymentAmount = Number(order.totalAmount);
    }

    if (!paymentAmount || paymentAmount <= 0) {
      throw new BadRequestException('Invalid payment amount');
    }

    const amountPaise = Math.round(paymentAmount * 100);
// Always create a fresh Razorpay Order.
// Razorpay Orders cannot be reused once paid or closed.

await this.prisma.payment.updateMany({
  where: {
    orderId: dto.orderId,
    status: PaymentStatus.PENDING,
  },
  data: {
    status: PaymentStatus.FAILED,
  },
});

    let razorpayOrder: any;

    try {
      this.logger.log(
        `Creating Razorpay order for Order ${dto.orderId}`,
      );

      razorpayOrder = await this.razorpay.orders.create({
        amount: amountPaise,
        currency: 'INR',
       receipt: `${order.orderNumber}-${Date.now()}`
      });

      this.logger.log(
        `Razorpay Order Created: ${razorpayOrder.id}`,
      );
    } catch (error: any) {
      console.error('========== RAZORPAY ERROR ==========');
      console.error(error);
      console.error(error?.stack);
      console.error(error?.response);
      console.error(error?.error);

      throw new BadRequestException(
        error?.error?.description ??
          error?.message ??
          'Unable to create Razorpay order',
      );
    }
const payment = await this.prisma.payment.create({
  data: {
    orderId: dto.orderId,
    razorpayOrderId: razorpayOrder.id,
    amount: paymentAmount,
    status: PaymentStatus.PENDING,
    method: dto.method,
    razorpayPaymentId: null,
    razorpaySignature: null,
  },
});

    this.logger.log(
      `Payment record created: ${payment.id}`,
    );

    return {
      dbOrderId: dto.orderId,
      razorpayOrderId: razorpayOrder.id,
      amount: amountPaise,
      currency: 'INR',
      paymentId: payment.id,
    };
  }  /**
   * Verify Razorpay payment signature
   */
  async verifyPayment(dto: VerifyPaymentDto) {
    const secret = process.env.RAZORPAY_KEY_SECRET;

    if (!secret) {
      throw new BadRequestException(
        'RAZORPAY_KEY_SECRET is missing',
      );
    }

    const generatedSignature = crypto
      .createHmac('sha256', secret)
      .update(
        `${dto.razorpayOrderId}|${dto.razorpayPaymentId}`,
      )
      .digest('hex');

    const isDev =
      process.env.NODE_ENV !== 'production' ||
      process.env.GUEST_CHECKOUT === 'true';

    if (
      generatedSignature !== dto.razorpaySignature &&
      !isDev
    ) {
      throw new BadRequestException(
        'Payment signature verification failed',
      );
    }

    const payment = await this.prisma.payment.findUnique({
      where: {
        razorpayOrderId: dto.razorpayOrderId,
      },
    });

    if (!payment) {
      throw new NotFoundException(
        'Payment record not found',
      );
    }

    if (payment.status === PaymentStatus.COMPLETED) {
      return {
        message: 'Payment already verified',
        orderId: payment.orderId,
      };
    }

    await this.prisma.$transaction([
      this.prisma.payment.update({
        where: {
          id: payment.id,
        },
        data: {
          razorpayPaymentId: dto.razorpayPaymentId,
          razorpaySignature: dto.razorpaySignature,
          status: PaymentStatus.COMPLETED,
        },
      }),

      this.prisma.order.update({
        where: {
          id: payment.orderId,
        },
        data: {
          paymentStatus: PaymentStatus.COMPLETED,
        },
      }),
    ]);

    this.logger.log(
      `Payment verified: ${dto.razorpayPaymentId}`,
    );

    return {
      message: 'Payment verified successfully',
      orderId: payment.orderId,
    };
  }

  /**
   * Razorpay Webhook
   */
  async handleWebhook(
    body: Record<string, unknown>,
    signature: string,
    rawBody: string,
  ) {
    const secret =
      process.env.RAZORPAY_WEBHOOK_SECRET ??
      'webhook_secret';

    const generatedSignature = crypto
      .createHmac('sha256', secret)
      .update(rawBody)
      .digest('hex');

    if (generatedSignature !== signature) {
      throw new BadRequestException(
        'Invalid webhook signature',
      );
    }

    const event = body['event'] as string;
    const payload = body['payload'] as Record<
      string,
      unknown
    >;

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
        this.logger.warn(
          `Unhandled webhook event: ${event}`,
        );
    }

    return {
      received: true,
    };
  }

  /**
   * Initiate Refund
   */
  async initiateRefund(
    orderId: string,
    reason: string,
  ) {
    const payment =
      await this.prisma.payment.findFirst({
        where: {
          orderId,
          status: PaymentStatus.COMPLETED,
        },
        include: {
          refunds: true,
        },
      });

    if (!payment) {
      throw new NotFoundException(
        'No completed payment found',
      );
    }

    if (payment.refunds.length > 0) {
      throw new BadRequestException(
        'Refund already initiated',
      );
    }

    const refund =
      await this.razorpay.payments.refund(
        payment.razorpayPaymentId,
        {
          amount: Math.round(
            Number(payment.amount) * 100,
          ),
          notes: {
            reason,
          },
        },
      );

    await this.prisma.paymentRefund.create({
      data: {
        paymentId: payment.id,
        razorpayRefundId: refund.id,
        amount: payment.amount,
      },
    });

    await this.prisma.order.update({
      where: {
        id: orderId,
      },
      data: {
        paymentStatus: PaymentStatus.REFUNDED,
      },
    });

    this.logger.log(
      `Refund initiated: ${refund.id}`,
    );

    return {
      message: 'Refund initiated',
      refundId: refund.id,
    };
  }

  private async handlePaymentCaptured(
    payload: Record<string, unknown>,
  ) {
    const payment = (payload['payment'] as any)?.entity;

    if (!payment?.order_id) return;

    await this.prisma.payment.updateMany({
      where: {
        razorpayOrderId: payment.order_id,
      },
      data: {
        status: PaymentStatus.COMPLETED,
      },
    });
  }

  private async handlePaymentFailed(
    payload: Record<string, unknown>,
  ) {
    const payment = (payload['payment'] as any)?.entity;

    if (!payment?.order_id) return;

    await this.prisma.payment.updateMany({
      where: {
        razorpayOrderId: payment.order_id,
      },
      data: {
        status: PaymentStatus.FAILED,
      },
    });
  }

  private async handleRefundProcessed(
    payload: Record<string, unknown>,
  ) {
    const refund = (payload['refund'] as any)?.entity;

    this.logger.log(
      `Refund processed: ${refund?.id}`,
    );
  }
}