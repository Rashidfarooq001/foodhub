import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
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
   * Authoritative: Server strictly computes payment amount from database Order record.
   * Client-supplied amount is intentionally ignored.
   */
  async createPaymentOrder(dto: CreatePaymentDto, userId?: string) {
    const order = await this.prisma.order.findUnique({
      where: {
        id: dto.orderId,
      },
      include: {
        customer: true,
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    // Verify order ownership if userId is provided
    if (userId) {
      const isOwner = order.customer?.userId === userId || order.customerId === userId;
      if (!isOwner) {
        throw new ForbiddenException('You do not have access to pay for this order');
      }
    }

    // Authoritative server-side payment amount from database Order record
    const paymentAmount = Number(order.totalAmount);

    if (!paymentAmount || paymentAmount <= 0) {
      throw new BadRequestException('Invalid order total amount for payment');
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
  async verifyPayment(dto: VerifyPaymentDto, userId?: string) {
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
      include: {
        order: {
          include: {
            customer: true,
          },
        },
      },
    });

    if (!payment) {
      throw new NotFoundException(
        'Payment record not found',
      );
    }

    // Verify order ownership if userId is provided
    if (userId && payment.order) {
      const isOwner = payment.order.customer?.userId === userId || payment.order.customerId === userId;
      if (!isOwner) {
        throw new ForbiddenException('You do not have permission to verify payment for this order');
      }
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

  async getPaymentsForAdmin(page = 1, limit = 50) {
    const skip = (page - 1) * limit;

    const [payments, total, allOrders, completedPaymentsAgg, settlements, refundTotalAgg] = await Promise.all([
      this.prisma.payment.findMany({
        include: {
          order: {
            include: {
              restaurant: { select: { id: true, name: true } },
              customer: {
                include: {
                  user: {
                    include: {
                      profile: true,
                    },
                  },
                },
              },
              deliveryJob: true,
            },
          },
          refunds: true,
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.payment.count(),
      this.prisma.order.findMany({
        where: { paymentStatus: PaymentStatus.COMPLETED },
        select: {
          id: true,
          totalAmount: true,
          subtotal: true,
          deliveryFee: true,
          packagingFee: true,
          taxAmount: true,
          pricingSnapshot: true,
          restaurantId: true,
          deliveryJob: { select: { riderPayout: true } },
        },
      }),
      this.prisma.payment.aggregate({
        where: { status: PaymentStatus.COMPLETED },
        _sum: { amount: true },
      }),
      this.prisma.settlement.findMany({ select: { restaurantId: true, paidAmount: true, netPayable: true, utrNumber: true, settledAt: true } }),
      this.prisma.paymentRefund.aggregate({ _sum: { amount: true } }),
    ]);

    // Authoritative platform aggregates
    let totalCustomerCollections = 0;
    let totalRestaurantGross = 0;
    let totalRestaurantCommission = 0;
    let totalRestaurantNetPayable = 0;
    let totalPlatformFees = 0;
    let totalDeliveryFees = 0;
    let totalRiderEarnings = 0;
    let totalStatutoryGst = 0;

    for (const ord of allOrders) {
      const snap: any = ord.pricingSnapshot || {};
      const gross = Number(ord.subtotal || 0);
      const commission = Number(snap.commissionAmount || 0);
      const netPayable = Math.max(0, gross - commission);
      const platFee = Number(snap.platformFee ?? 3.0);
      const delivFee = Number(ord.deliveryFee || 0);
      const tax = Number(ord.taxAmount || 0);
      const riderPay = Number(ord.deliveryJob?.riderPayout || 0);

      totalCustomerCollections += Number(ord.totalAmount || 0);
      totalRestaurantGross += gross;
      totalRestaurantCommission += commission;
      totalRestaurantNetPayable += netPayable;
      totalPlatformFees += platFee;
      totalDeliveryFees += delivFee;
      totalRiderEarnings += riderPay;
      totalStatutoryGst += tax;
    }

    const totalRestaurantSettled = settlements.reduce((sum, s) => sum + Number(s.paidAmount || 0), 0);
    const totalRestaurantPending = Math.max(0, totalRestaurantNetPayable - totalRestaurantSettled);
    const totalPlatformOperatingRevenue = totalRestaurantCommission + totalPlatformFees;
    const totalPlatformNetContribution = (totalPlatformOperatingRevenue + totalDeliveryFees) - totalRiderEarnings;

    const mappedPayments = payments.map((p) => {
      const ord = p.order;
      const snap: any = ord?.pricingSnapshot || {};
      const foodSubtotal = Number(ord?.subtotal || p.amount || 0);
      const deliveryFee = Number(ord?.deliveryFee || 0);
      const platformFee = Number(snap.platformFee ?? (p.amount ? 3.0 : 0));
      const gst = Number(ord?.taxAmount || 0);
      const customerPaid = Number(p.amount);

      const commissionRate = snap.commissionRate !== undefined ? snap.commissionRate : null;
      const commissionStatus = snap.commissionStatus || (commissionRate !== null ? 'CONFIGURED' : 'UNCONFIGURED');
      const commissionAmount = Number(snap.commissionAmount || 0);
      const restaurantNetPayable = Math.max(0, foodSubtotal - commissionAmount);

      const riderJob = ord?.deliveryJob;
      const riderDistanceKm = Number(riderJob?.distanceKm || 0);
      const riderPayout = Number(riderJob?.riderPayout || 0);

      const platformOperatingInflow = commissionAmount + platformFee + deliveryFee;

      const restaurantSettlement = settlements.find((s) => s.restaurantId === ord?.restaurantId);

      // Reconciliation verification: Customer Paid vs (Restaurant Net + Commission + Platform Fee + Delivery Fee + GST)
      const reconstructedTotal = restaurantNetPayable + commissionAmount + platformFee + deliveryFee + gst;
      const isBalanced = Math.abs(customerPaid - reconstructedTotal) < 0.01;

      return {
        id: p.id,
        orderId: p.orderId,
        orderNumber: ord?.orderNumber || p.orderId,
        customer: {
          name: ord?.customer?.user?.profile
            ? `${ord.customer.user.profile.firstName} ${ord.customer.user.profile.lastName || ''}`.trim()
            : 'Customer',
          phone: ord?.customer?.user?.phone || '—',
          foodSubtotal,
          deliveryFee,
          platformFee,
          gst,
          customerPaid,
          paymentMethod: ord?.paymentMethod || 'UPI',
          gatewayTransactionId: p.razorpayPaymentId || p.razorpayOrderId || '—',
          status: p.status,
        },
        restaurant: {
          id: ord?.restaurant?.id || '—',
          name: ord?.restaurant?.name || 'Restaurant',
          grossFoodSales: foodSubtotal,
          commissionRate,
          commissionStatus,
          commissionAmount,
          restaurantNetPayable,
          settlementStatus: restaurantSettlement ? 'PAID' : 'PENDING',
          utrNumber: restaurantSettlement?.utrNumber || '—',
        },
        platform: {
          commissionEarned: commissionAmount,
          platformFeeCollected: platformFee,
          deliveryFeeCollected: deliveryFee,
          platformOperatingInflow,
        },
        rider: {
          distanceKm: riderDistanceKm,
          baseEarning: riderPayout > 0 ? 25.0 : 0,
          distanceEarning: riderPayout > 0 ? Math.max(0, riderPayout - 25.0) : 0,
          totalRiderEarning: riderPayout,
          settlementStatus: p.status === PaymentStatus.COMPLETED ? 'PENDING' : 'UNALLOCATED',
        },
        statutory: {
          gstLiability: gst,
        },
        reconciliation: {
          status: isBalanced ? 'BALANCED' : 'MISMATCH',
          discrepancy: Math.round((customerPaid - reconstructedTotal) * 100) / 100,
        },
        hasRefund: (p.refunds && p.refunds.length > 0) || false,
        refundAmount: p.refunds ? p.refunds.reduce((sum, r) => sum + Number(r.amount), 0) : 0,
        createdAt: p.createdAt,
      };
    });

    return {
      stats: {
        totalCustomerCollections: Math.round(totalCustomerCollections * 100) / 100,
        completedCustomerPayments: total,
        totalGmv: Math.round(totalCustomerCollections * 100) / 100,
        restaurantGrossPayable: Math.round(totalRestaurantGross * 100) / 100,
        restaurantCommission: Math.round(totalRestaurantCommission * 100) / 100,
        restaurantNetPayable: Math.round(totalRestaurantNetPayable * 100) / 100,
        restaurantSettledAmount: Math.round(totalRestaurantSettled * 100) / 100,
        restaurantPendingSettlement: Math.round(totalRestaurantPending * 100) / 100,
        riderGrossEarnings: Math.round(totalRiderEarnings * 100) / 100,
        riderPendingSettlement: Math.round(totalRiderEarnings * 100) / 100,
        riderSettledAmount: 0,
        platformCommissionRevenue: Math.round(totalRestaurantCommission * 100) / 100,
        platformFeeRevenue: Math.round(totalPlatformFees * 100) / 100,
        deliveryFeeRevenue: Math.round(totalDeliveryFees * 100) / 100,
        totalPlatformOperatingRevenue: Math.round(totalPlatformOperatingRevenue * 100) / 100,
        platformNetContribution: Math.round(totalPlatformNetContribution * 100) / 100,
        refundAmount: Number(refundTotalAgg._sum.amount ?? 0),
        totalPayments: total,
      },
      payments: mappedPayments,
      total,
      page,
      limit,
    };
  }

  private async handlePaymentCaptured(
    payload: Record<string, unknown>,
  ) {
    const paymentEntity = (payload['payment'] as any)?.entity;

    if (!paymentEntity?.order_id) return;

    const existingPayment = await this.prisma.payment.findUnique({
      where: {
        razorpayOrderId: paymentEntity.order_id,
      },
      include: {
        order: true,
      },
    });

    if (!existingPayment) return;

    // Idempotency: If already marked COMPLETED on both payment and order, avoid redundant updates
    if (
      existingPayment.status === PaymentStatus.COMPLETED &&
      existingPayment.order?.paymentStatus === PaymentStatus.COMPLETED
    ) {
      return;
    }

    await this.prisma.$transaction([
      this.prisma.payment.update({
        where: { id: existingPayment.id },
        data: {
          status: PaymentStatus.COMPLETED,
          razorpayPaymentId: paymentEntity.id || existingPayment.razorpayPaymentId,
        },
      }),
      this.prisma.order.update({
        where: { id: existingPayment.orderId },
        data: {
          paymentStatus: PaymentStatus.COMPLETED,
        },
      }),
    ]);
  }

  private async handlePaymentFailed(
    payload: Record<string, unknown>,
  ) {
    const paymentEntity = (payload['payment'] as any)?.entity;

    if (!paymentEntity?.order_id) return;

    const existingPayment = await this.prisma.payment.findUnique({
      where: {
        razorpayOrderId: paymentEntity.order_id,
      },
    });

    if (!existingPayment) return;

    // If payment was already completed, do not downgrade to FAILED
    if (existingPayment.status === PaymentStatus.COMPLETED) {
      return;
    }

    await this.prisma.$transaction([
      this.prisma.payment.update({
        where: { id: existingPayment.id },
        data: {
          status: PaymentStatus.FAILED,
        },
      }),
      this.prisma.order.update({
        where: { id: existingPayment.orderId },
        data: {
          paymentStatus: PaymentStatus.FAILED,
        },
      }),
    ]);
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