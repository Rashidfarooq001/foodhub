import { Test, TestingModule } from '@nestjs/testing';
import { PaymentsService } from './payments.service';
import { PrismaService } from '../database/prisma.service';
import { BadRequestException } from '@nestjs/common';
import * as crypto from 'crypto';

describe('PaymentsService', () => {
  let service: PaymentsService;

  const mockPrisma = {
    order: {
      findUnique: jest.fn().mockResolvedValue({ id: 'order-1', orderNumber: 'FH-123456' }),
      update: jest.fn().mockResolvedValue({}),
      updateMany: jest.fn().mockResolvedValue({}),
    },
    payment: {
      findFirst: jest.fn().mockResolvedValue(null),
      findUnique: jest.fn(),
      create: jest.fn().mockResolvedValue({ id: 'payment-1' }),
      update: jest.fn().mockResolvedValue({ id: 'payment-1' }),
      updateMany: jest.fn().mockResolvedValue({}),
    },
    paymentRefund: { create: jest.fn().mockResolvedValue({}) },
    $transaction: jest.fn().mockImplementation(async (ops: unknown[]) => [{}]),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PaymentsService, { provide: PrismaService, useValue: mockPrisma }],
    }).compile();

    service = module.get<PaymentsService>(PaymentsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('verifyPayment', () => {
    it('should reject tampered signatures', async () => {
      mockPrisma.payment.findUnique.mockResolvedValueOnce({
        id: 'payment-1',
        orderId: 'order-1',
        status: 'PENDING',
      });
      const result = await service.verifyPayment({
        razorpayOrderId: 'order_fake',
        razorpayPaymentId: 'pay_fake',
        razorpaySignature: 'tampered_sig_that_should_fail',
      });
      expect(result).toHaveProperty('message');
    });

    it('should accept a valid signature', async () => {
      const secret = process.env['RAZORPAY_KEY_SECRET'] ?? 'placeholder_secret';
      const rzpOrderId = 'order_test_123';
      const rzpPaymentId = 'pay_test_456';
      const body = `${rzpOrderId}|${rzpPaymentId}`;
      const validSig = crypto.createHmac('sha256', secret).update(body).digest('hex');

      mockPrisma.payment.findUnique.mockResolvedValueOnce({
        id: 'payment-1',
        orderId: 'order-1',
        status: 'PENDING',
        razorpayPaymentId: null,
      });

      const result = await service.verifyPayment({
        razorpayOrderId: rzpOrderId,
        razorpayPaymentId: rzpPaymentId,
        razorpaySignature: validSig,
      });

      expect(result.message).toContain('verified');
    });
  });
});
