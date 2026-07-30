import { Test, TestingModule } from '@nestjs/testing';
import { ReviewsService } from './reviews.service';
import { PrismaService } from '../database/prisma.service';
import { BadRequestException, ConflictException, ForbiddenException } from '@nestjs/common';
import { OrderStatus } from '@prisma/client';

const mockCustomer  = { id: 'cust-1', userId: 'user-1' };
const mockDeliveredOrder = {
  id:         'order-1',
  customerId: 'cust-1',
  restaurantId: 'rest-1',
  status:     OrderStatus.DELIVERED,
};

describe('ReviewsService', () => {
  let service: ReviewsService;

  const mockPrisma = {
    customer: {
      findFirst:        jest.fn().mockResolvedValue(mockCustomer),
      findFirstOrThrow: jest.fn().mockResolvedValue(mockCustomer),
    },
    order: {
      findUnique: jest.fn().mockResolvedValue(mockDeliveredOrder),
    },
    restaurantReview: {
      findFirst: jest.fn().mockResolvedValue(null),
      create:    jest.fn().mockResolvedValue({ id: 'review-1' }),
      findMany:  jest.fn().mockResolvedValue([{ rating: 5 }]),
      count:     jest.fn().mockResolvedValue(1),
      findUnique: jest.fn(),
      update:    jest.fn().mockResolvedValue({ id: 'review-1', isHidden: true }),
      delete:    jest.fn().mockResolvedValue({}),
    },
    restaurant: {
      update: jest.fn().mockResolvedValue({}),
    },
    foodReview: {
      findFirst: jest.fn().mockResolvedValue(null),
      create:    jest.fn().mockResolvedValue({ id: 'frev-1' }),
    },
    driverReview: {
      findFirst: jest.fn().mockResolvedValue(null),
      create:    jest.fn().mockResolvedValue({ id: 'drev-1' }),
      findMany:  jest.fn().mockResolvedValue([{ rating: 4 }]),
    },
    driver: {
      update: jest.fn().mockResolvedValue({}),
    },
    reviewVote:   { upsert: jest.fn().mockResolvedValue({}) },
    reviewReport: { create: jest.fn().mockResolvedValue({}) },
    reviewReply:  { create: jest.fn().mockResolvedValue({}) },
    $transaction: jest.fn().mockImplementation(async (ops: unknown[]) => [[], 0]),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReviewsService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<ReviewsService>(ReviewsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should reject review for non-delivered order', async () => {
    mockPrisma.order.findUnique.mockResolvedValueOnce({
      ...mockDeliveredOrder,
      status: OrderStatus.ACCEPTED,
    });

    await expect(
      service.createRestaurantReview('user-1', {
        orderId: 'order-1', restaurantId: 'rest-1', rating: 5,
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('should reject review for order that does not belong to user', async () => {
    mockPrisma.order.findUnique.mockResolvedValueOnce({
      ...mockDeliveredOrder,
      customerId: 'cust-9999', // different customer
    });

    await expect(
      service.createRestaurantReview('user-1', {
        orderId: 'order-1', restaurantId: 'rest-1', rating: 5,
      }),
    ).rejects.toThrow(ForbiddenException);
  });

  it('should reject duplicate review for same order', async () => {
    mockPrisma.restaurantReview.findFirst.mockResolvedValueOnce({ id: 'existing-review' });

    await expect(
      service.createRestaurantReview('user-1', {
        orderId: 'order-1', restaurantId: 'rest-1', rating: 4,
      }),
    ).rejects.toThrow(ConflictException);
  });

  it('should create a valid restaurant review and update rating', async () => {
    mockPrisma.restaurantReview.findFirst.mockResolvedValueOnce(null);

    const result = await service.createRestaurantReview('user-1', {
      orderId: 'order-1', restaurantId: 'rest-1', rating: 5, comment: 'Great!',
    });

    expect(result.id).toBe('review-1');
    expect(mockPrisma.restaurant.update).toHaveBeenCalled();
  });

  it('should upsert vote on voteReview', async () => {
    await service.voteReview('review-1', 'user-1', true);
    expect(mockPrisma.reviewVote.upsert).toHaveBeenCalledWith(
      expect.objectContaining({ create: { reviewId: 'review-1', userId: 'user-1', isHelpful: true } }),
    );
  });
});
