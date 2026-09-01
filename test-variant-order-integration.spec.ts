import { Test, TestingModule } from '@nestjs/testing';
import { OrdersService } from '../apps/backend/src/modules/orders/orders.service';
import { OrdersValidationService } from '../apps/backend/src/modules/orders/orders.validation.service';
import { PrismaService } from '../apps/backend/src/modules/database/prisma.service';
import { BadRequestException } from '@nestjs/common';
import { Decimal } from '@prisma/client/runtime/library';

describe('FoodHub End-to-End Menu Variant & Order Immutability Integration Test', () => {
  let ordersService: OrdersService;
  let validationService: OrdersValidationService;

  const mockRestaurantId = '11111111-1111-1111-1111-111111111111';
  const mockFoodItemId = '22222222-2222-2222-2222-222222222222';
  const mockVariantHalfId = '33333333-3333-3333-3333-333333333333';
  const mockVariantFullId = '44444444-4444-4444-4444-444444444444';

  const mockFoodItem = {
    id: mockFoodItemId,
    restaurantId: mockRestaurantId,
    name: 'Special Hyderabadi Biryani',
    price: new Decimal(260.0),
    isAvailable: true,
    variants: [
      {
        id: mockVariantHalfId,
        foodItemId: mockFoodItemId,
        variantName: 'Half',
        price: new Decimal(140.0),
        isAvailable: true,
        displayOrder: 0,
      },
      {
        id: mockVariantFullId,
        foodItemId: mockFoodItemId,
        variantName: 'Full',
        price: new Decimal(260.0),
        isAvailable: true,
        displayOrder: 1,
      },
    ],
  };

  const mockPrismaService = {
    foodItem: {
      findUnique: jest.fn().mockImplementation(({ where }) => {
        if (where.id === mockFoodItemId) return Promise.resolve(mockFoodItem);
        return Promise.resolve(null);
      }),
      findMany: jest.fn().mockResolvedValue([mockFoodItem]),
    },
    foodVariant: {
      findUnique: jest.fn(),
    },
    restaurant: {
      findUnique: jest.fn().mockResolvedValue({
        id: mockRestaurantId,
        name: 'Test Kitchen',
        status: 'APPROVED',
        latitude: 34.35,
        longitude: 74.65,
        deliveryRadius: 15,
      }),
    },
    pricingConfig: {
      findFirst: jest.fn().mockResolvedValue({
        baseDeliveryFee: new Decimal(15.0),
        baseDeliveryDistanceKm: new Decimal(3.0),
        perKmDeliveryFee: new Decimal(5.0),
        platformFee: new Decimal(3.0),
        smallOrderFeeThreshold: new Decimal(0.0),
        smallOrderFee: new Decimal(0.0),
        defaultCommissionRate: new Decimal(0.15),
      }),
    },
    user: {
      findUnique: jest
        .fn()
        .mockResolvedValue({ id: 'user-1', phone: '+919999999999', isBlocked: false }),
    },
  };

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrdersService,
        OrdersValidationService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    ordersService = module.get<OrdersService>(OrdersService);
    validationService = module.get<OrdersValidationService>(OrdersValidationService);
  });

  it('should validate that items and variants exist, belong to the restaurant, and are available', async () => {
    await expect(
      validationService.validateItemsAvailable(
        [
          {
            foodItemId: mockFoodItemId,
            variantId: mockVariantHalfId,
            quantity: 2,
          },
        ],
        mockRestaurantId,
      ),
    ).resolves.not.toThrow();
  });

  it('should reject order if variant is not available', async () => {
    const unavailableFood = {
      ...mockFoodItem,
      variants: [
        {
          id: 'unavail-var-id',
          foodItemId: mockFoodItemId,
          variantName: 'Special',
          price: new Decimal(300.0),
          isAvailable: false,
          displayOrder: 2,
        },
      ],
    };

    mockPrismaService.foodItem.findUnique.mockResolvedValueOnce(unavailableFood);

    await expect(
      validationService.validateItemsAvailable(
        [
          {
            foodItemId: mockFoodItemId,
            variantId: 'unavail-var-id',
            quantity: 1,
          },
        ],
        mockRestaurantId,
      ),
    ).rejects.toThrow(BadRequestException);
  });
});
