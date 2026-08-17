import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException, BadRequestException } from '@nestjs/common';
import { RestaurantsService } from '../../modules/restaurants/restaurants.service';
import { JwtStrategy } from '../../modules/auth/strategies/jwt.strategy';
import { PrismaService } from '../../modules/database/prisma.service';
import { ConfigService } from '@nestjs/config';
import { RestaurantStatus, UserRole } from '@prisma/client';

describe('Restaurant Lifecycle & Administrator Account Protection Regression Suite', () => {
  let restaurantsService: RestaurantsService;
  let jwtStrategy: JwtStrategy;

  // In-memory mock database state
  let users: any[] = [];
  let restaurants: any[] = [];
  let auditLogs: any[] = [];

  const mockPrisma = {
    restaurant: {
      findUnique: jest.fn().mockImplementation(async ({ where }) => {
        return restaurants.find((r) => r.id === where.id || r.slug === where.slug) || null;
      }),
      findFirst: jest.fn().mockImplementation(async ({ where }) => {
        return restaurants.find((r) => {
          if (where.ownerId && r.ownerId !== where.ownerId) return false;
          if (where.id?.not && r.id === where.id.not) return false;
          if (where.status && r.status !== where.status) return false;
          if (where.deletedAt === null && r.deletedAt !== null) return false;
          return true;
        }) || null;
      }),
      update: jest.fn().mockImplementation(async ({ where, data }) => {
        const idx = restaurants.findIndex((r) => r.id === where.id);
        if (idx === -1) throw new Error('Restaurant not found');
        restaurants[idx] = { ...restaurants[idx], ...data };
        return restaurants[idx];
      }),
    },
    user: {
      findUnique: jest.fn().mockImplementation(async ({ where }) => {
        return users.find((u) => u.id === where.id) || null;
      }),
      update: jest.fn().mockImplementation(async ({ where, data }) => {
        const idx = users.findIndex((u) => u.id === where.id);
        if (idx === -1) throw new Error('User not found');
        users[idx] = { ...users[idx], ...data };
        return users[idx];
      }),
    },
    restaurantStaff: {
      upsert: jest.fn().mockResolvedValue({ id: 'staff-1' }),
    },
    auditLog: {
      create: jest.fn().mockImplementation(async ({ data }) => {
        auditLogs.push(data);
        return data;
      }),
    },
  };

  const mockConfigService = {
    get: jest.fn().mockReturnValue('test-secret-key-1234567890'),
  };

  beforeEach(async () => {
    // Reset in-memory database
    users = [
      {
        id: 'admin-user-uuid-1',
        phone: '+919596689385',
        email: 'admin@zaykafood.com',
        role: UserRole.SUPER_ADMIN,
        isActive: true,
        isVerified: true,
        deletedAt: null,
        profile: { firstName: 'Super', lastName: 'Admin' },
      },
      {
        id: 'regular-admin-uuid-2',
        phone: '+919876543210',
        email: 'ops@zaykafood.com',
        role: UserRole.ADMIN,
        isActive: true,
        isVerified: true,
        deletedAt: null,
        profile: { firstName: 'Ops', lastName: 'Admin' },
      },
      {
        id: 'merchant-user-uuid-3',
        phone: '+919123456789',
        email: 'merchant@testrestaurant.com',
        role: UserRole.RESTAURANT_OWNER,
        isActive: true,
        isVerified: true,
        deletedAt: null,
        profile: { firstName: 'Test', lastName: 'Merchant' },
      },
    ];

    restaurants = [
      {
        id: 'rest-admin-owned-uuid',
        name: 'Test Restaurant Accidentally Owned by Admin',
        ownerId: 'admin-user-uuid-1',
        status: RestaurantStatus.APPROVED,
        isOpen: true,
        rejectionReason: null,
        deletedAt: null,
      },
      {
        id: 'rest-merchant-owned-uuid',
        name: 'Authentic Kashmiri Wazwan',
        ownerId: 'merchant-user-uuid-3',
        status: RestaurantStatus.APPROVED,
        isOpen: true,
        rejectionReason: null,
        deletedAt: null,
      },
    ];

    auditLogs = [];

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RestaurantsService,
        JwtStrategy,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    restaurantsService = module.get<RestaurantsService>(RestaurantsService);
    jwtStrategy = module.get<JwtStrategy>(JwtStrategy);
  });

  describe('1. Platform Administrator Account Protection on Restaurant Rejection/Suspension', () => {
    it('SUPER_ADMIN account remains isActive=true when an admin-linked restaurant is rejected', async () => {
      // Before state verification
      const adminBefore = users.find((u) => u.id === 'admin-user-uuid-1');
      expect(adminBefore.isActive).toBe(true);
      expect(adminBefore.role).toBe(UserRole.SUPER_ADMIN);

      // Admin rejects restaurant
      await restaurantsService.updateVerificationStatus(
        'rest-admin-owned-uuid',
        'REJECTED',
        'FSSAI document unreadable during audit review',
        'admin-user-uuid-1',
      );

      // After state verification
      const adminAfter = users.find((u) => u.id === 'admin-user-uuid-1');
      const restaurantAfter = restaurants.find((r) => r.id === 'rest-admin-owned-uuid');

      // CRITICAL ACCEPTANCE ASSERTION: Admin account must NEVER be deactivated
      expect(adminAfter.isActive).toBe(true);
      expect(adminAfter.deletedAt).toBeNull();
      expect(restaurantAfter.status).toBe(RestaurantStatus.REJECTED);
      expect(restaurantAfter.isOpen).toBe(false);
      expect(restaurantAfter.rejectionReason).toBe('FSSAI document unreadable during audit review');

      // SuperAdmin must remain fully authenticated
      const validatedAuth = await jwtStrategy.validate({
        sub: 'admin-user-uuid-1',
        phone: '+919596689385',
        role: UserRole.SUPER_ADMIN,
        sessionId: 'sess-superadmin-1',
      });
      expect(validatedAuth).toBeDefined();
      expect(validatedAuth.id).toBe('admin-user-uuid-1');
      expect(validatedAuth.role).toBe(UserRole.SUPER_ADMIN);
    });

    it('ADMIN account remains isActive=true when an admin-linked restaurant is suspended', async () => {
      // Link restaurant to regular admin
      restaurants[0].ownerId = 'regular-admin-uuid-2';

      // Admin suspends restaurant
      await restaurantsService.updateVerificationStatus(
        'rest-admin-owned-uuid',
        'SUSPENDED',
        'Temporary hygiene inspection pause',
        'admin-user-uuid-1',
      );

      const adminAfter = users.find((u) => u.id === 'regular-admin-uuid-2');
      const restaurantAfter = restaurants.find((r) => r.id === 'rest-admin-owned-uuid');

      expect(adminAfter.isActive).toBe(true);
      expect(adminAfter.deletedAt).toBeNull();
      expect(restaurantAfter.status).toBe(RestaurantStatus.SUSPENDED);
      expect(restaurantAfter.isOpen).toBe(false);

      // Regular Admin must remain fully authenticated
      const validatedAuth = await jwtStrategy.validate({
        sub: 'regular-admin-uuid-2',
        phone: '+919876543210',
        role: UserRole.ADMIN,
        sessionId: 'sess-admin-2',
      });
      expect(validatedAuth).toBeDefined();
      expect(validatedAuth.id).toBe('regular-admin-uuid-2');
      expect(validatedAuth.role).toBe(UserRole.ADMIN);
    });
  });

  describe('2. Merchant Owner Lifecycle & Access Control Transitions', () => {
    it('should correctly block merchant access when restaurant is SUSPENDED or REJECTED', async () => {
      // Suspend merchant restaurant
      await restaurantsService.updateVerificationStatus(
        'rest-merchant-owned-uuid',
        'SUSPENDED',
        'Expired municipal license',
        'admin-user-uuid-1',
      );

      const merchantUser = users.find((u) => u.id === 'merchant-user-uuid-3');
      const merchantRest = restaurants.find((r) => r.id === 'rest-merchant-owned-uuid');

      expect(merchantRest.status).toBe(RestaurantStatus.SUSPENDED);
      expect(merchantRest.isOpen).toBe(false);
      expect(merchantUser.isActive).toBe(false);

      // Merchant JWT validation must be rejected (401 Unauthorized)
      await expect(
        jwtStrategy.validate({
          sub: 'merchant-user-uuid-3',
          phone: '+919123456789',
          role: UserRole.RESTAURANT_OWNER,
          sessionId: 'sess-merchant-3',
        }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should restore merchant access when restaurant is REACTIVATED / APPROVED', async () => {
      // First suspend
      await restaurantsService.updateVerificationStatus(
        'rest-merchant-owned-uuid',
        'SUSPENDED',
        'Audit review',
        'admin-user-uuid-1',
      );

      // Then re-approve
      await restaurantsService.updateVerificationStatus(
        'rest-merchant-owned-uuid',
        'APPROVED',
        undefined,
        'admin-user-uuid-1',
      );

      const merchantUser = users.find((u) => u.id === 'merchant-user-uuid-3');
      const merchantRest = restaurants.find((r) => r.id === 'rest-merchant-owned-uuid');

      expect(merchantRest.status).toBe(RestaurantStatus.APPROVED);
      expect(merchantRest.isOpen).toBe(true);
      expect(merchantUser.isActive).toBe(true);
      expect(merchantUser.isVerified).toBe(true);

      // Merchant JWT validation must now succeed
      const validatedAuth = await jwtStrategy.validate({
        sub: 'merchant-user-uuid-3',
        phone: '+919123456789',
        role: UserRole.RESTAURANT_OWNER,
        sessionId: 'sess-merchant-3',
      });
      expect(validatedAuth).toBeDefined();
      expect(validatedAuth.id).toBe('merchant-user-uuid-3');
      expect(validatedAuth.restaurantId).toBe('rest-merchant-owned-uuid');
    });

    it('should NOT deactivate merchant account if they own another APPROVED restaurant', async () => {
      // Add second approved restaurant for the same merchant
      restaurants.push({
        id: 'rest-merchant-second-branch',
        name: 'Wazwan Express Branch 2',
        ownerId: 'merchant-user-uuid-3',
        status: RestaurantStatus.APPROVED,
        isOpen: true,
        rejectionReason: null,
        deletedAt: null,
      });

      // Reject first restaurant
      await restaurantsService.updateVerificationStatus(
        'rest-merchant-owned-uuid',
        'REJECTED',
        'Branch 1 lease terminated',
        'admin-user-uuid-1',
      );

      const merchantUser = users.find((u) => u.id === 'merchant-user-uuid-3');
      // Merchant user should remain active because Branch 2 is active and approved!
      expect(merchantUser.isActive).toBe(true);
    });
  });

  describe('3. Authoritative Account State Validation (Zero Bypass)', () => {
    it('throws 401 for soft-deleted Admin accounts', async () => {
      users[0].deletedAt = new Date();

      await expect(
        jwtStrategy.validate({
          sub: 'admin-user-uuid-1',
          phone: '+919596689385',
          role: UserRole.SUPER_ADMIN,
          sessionId: 'sess-superadmin-1',
        }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('throws 401 for explicitly disabled Admin accounts', async () => {
      users[0].isActive = false;

      await expect(
        jwtStrategy.validate({
          sub: 'admin-user-uuid-1',
          phone: '+919596689385',
          role: UserRole.SUPER_ADMIN,
          sessionId: 'sess-superadmin-1',
        }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });
});
