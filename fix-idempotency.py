import sys
with open('apps/backend/src/modules/payments/payments.service.ts', 'r', encoding='utf-8') as f:
    content = f.read()

old_verify = '''    if (payment.status === PaymentStatus.COMPLETED) {
      return {
        message: 'Payment already verified',
        orderId: payment.orderId,
      };
    }

    await this.prisma.([
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
    ]);'''

new_verify = '''    const processed = await this.prisma.(async (tx) => {
      const updatedPayment = await tx.payment.updateMany({
        where: {
          id: payment.id,
          status: PaymentStatus.PENDING,
        },
        data: {
          razorpayPaymentId: dto.razorpayPaymentId,
          razorpaySignature: dto.razorpaySignature,
          status: PaymentStatus.COMPLETED,
        },
      });

      if (updatedPayment.count === 0) {
        return false;
      }

      await tx.order.update({
        where: { id: payment.orderId },
        data: { paymentStatus: PaymentStatus.COMPLETED },
      });

      return true;
    });

    if (!processed) {
      return {
        message: 'Payment already verified',
        orderId: payment.orderId,
      };
    }'''

content = content.replace(old_verify, new_verify)

old_webhook = '''    // Idempotency: If already marked COMPLETED on both payment and order, avoid redundant updates
    if (
      existingPayment.status === PaymentStatus.COMPLETED &&
      existingPayment.order?.paymentStatus === PaymentStatus.COMPLETED
    ) {
      return;
    }

    await this.prisma.([
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
    ]);'''

new_webhook = '''    const processed = await this.prisma.(async (tx) => {
      const updatedPayment = await tx.payment.updateMany({
        where: { id: existingPayment.id, status: PaymentStatus.PENDING },
        data: {
          status: PaymentStatus.COMPLETED,
          razorpayPaymentId: paymentEntity.id || existingPayment.razorpayPaymentId,
        },
      });

      if (updatedPayment.count === 0) {
        return false;
      }

      await tx.order.update({
        where: { id: existingPayment.orderId },
        data: { paymentStatus: PaymentStatus.COMPLETED },
      });
      return true;
    });

    if (!processed) {
      return;
    }'''

content = content.replace(old_webhook, new_webhook)

with open('apps/backend/src/modules/payments/payments.service.ts', 'w', encoding='utf-8') as f:
    f.write(content)
