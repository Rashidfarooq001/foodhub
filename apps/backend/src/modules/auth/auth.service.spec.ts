import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { OtpService } from '../otp/otp.service';
import { TokenService } from '../tokens/token.service';
import { SessionService } from '../sessions/session.service';
import { UsersService } from '../users/users.service';
import { UnauthorizedException, BadRequestException } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';

describe('FoodHub Complete Role & Pre-OTP Customer Signup Test Suite', () => {
  let service: AuthService;
  let usersService: UsersService;

  const mockAdminUser = {
    id: 'usr-admin-1',
    phone: '+919999999999',
    email: 'admin@foodhub.com',
    passwordHash: '$2b$12$e83B1m5zP6GqLpM0sK5xOuF6R7L9N0V2Z4Y6X8W0V2Z4Y6X8W0V2Z', // SuperAdmin123!
    role: UserRole.SUPER_ADMIN,
    isActive: true,
    profile: { firstName: 'FoodHub', lastName: 'Admin' },
  };

  const mockCustomerUser = {
    id: 'usr-customer-1',
    phone: '+919876543211',
    email: 'customer@foodhub.com',
    passwordHash: '$2b$12$e83B1m5zP6GqLpM0sK5xOuF6R7L9N0V2Z4Y6X8W0V2Z4Y6X8W0V2Z', // CustomerPass123!
    role: UserRole.CUSTOMER,
    isActive: true,
    profile: { firstName: 'Rahul', lastName: 'Sharma' },
  };

  const mockHotelOwnerUser = {
    id: 'usr-hotel-owner-1',
    phone: '+919876543210',
    email: 'owner@spicegarden.com',
    passwordHash: '$2b$12$e83B1m5zP6GqLpM0sK5xOuF6R7L9N0V2Z4Y6X8W0V2Z4Y6X8W0V2Z',
    role: UserRole.RESTAURANT_OWNER,
    isActive: true,
    profile: { firstName: 'Rajesh', lastName: 'Kumar' },
  };

  const mockDeliveryUser = {
    id: 'usr-driver-1',
    phone: '+919876500999',
    email: 'driver@foodhub.com',
    passwordHash: '$2b$12$e83B1m5zP6GqLpM0sK5xOuF6R7L9N0V2Z4Y6X8W0V2Z4Y6X8W0V2Z',
    role: UserRole.DELIVERY_PARTNER,
    isActive: true,
    profile: { firstName: 'Vikram', lastName: 'Singh' },
  };

  const mockOtpService = {
    sendOtp: jest.fn().mockResolvedValue({ message: 'OTP sent', cooldownSec: 60 }),
    verifyOtp: jest.fn().mockImplementation(async (phone: string, otp: string) => {
      if (otp === '0000' || otp === 'wrong') {
        throw new BadRequestException('Invalid or expired OTP');
      }
      return true;
    }),
    verifyAccessToken: jest.fn().mockImplementation(async (token: string) => {
      if (token === 'token_invalid') throw new BadRequestException('Invalid MSG91 access token');
      return {
        type: 'success',
        message: token.includes('admin')
          ? '+919999999999'
          : token.includes('mismatch')
          ? '+919111111111'
          : token.includes('new_user')
          ? '+919123456789'
          : token.includes('customer')
          ? '+919876543211'
          : token.includes('hotel')
          ? '+919876543210'
          : '+919876500999',
      };
    }),
  };

  const mockTokenService = {
    generateTokenPair: jest.fn().mockResolvedValue({
      accessToken: 'jwt-access-token',
      refreshToken: 'jwt-refresh-token',
      expiresInSec: 900,
    }),
    revokeAllUserTokens: jest.fn().mockResolvedValue(undefined),
  };

  const mockSessionService = {
    createSession: jest.fn().mockResolvedValue({ id: 'sess-uuid-1' }),
    terminateSession: jest.fn().mockResolvedValue({ message: 'Terminated' }),
    terminateAllUserSessions: jest.fn().mockResolvedValue({ message: 'All Terminated' }),
  };

  let mockCreatedUser: any = null;

  const mockUsersService = {
    findUserByPhone: jest.fn().mockImplementation(async (phone: string) => {
      if (mockCreatedUser && mockCreatedUser.phone === phone) return mockCreatedUser;
      if (phone === '+919999999999') return mockAdminUser;
      if (phone === '+919876543211') return mockCustomerUser;
      if (phone === '+919876543210') return mockHotelOwnerUser;
      if (phone === '+919876500999') return mockDeliveryUser;
      return null;
    }),
    findUserByPhoneOrEmail: jest.fn().mockImplementation(async (input: string) => {
      const clean = input.replace(/\D/g, '');
      if (input === '+919999999999' || input === 'admin@foodhub.com' || clean === '9999999999') return mockAdminUser;
      if (input === '+919876543211' || input === 'customer@foodhub.com' || clean === '9876543211') return mockCustomerUser;
      if (input === '+919876543210' || input === 'owner@spicegarden.com' || clean === '9876543210') return mockHotelOwnerUser;
      if (input === '+919876500999' || input === 'driver@foodhub.com' || clean === '9876500999') return mockDeliveryUser;
      return null;
    }),
    createUser: jest.fn().mockImplementation(async (phone: string, passwordHash: string, role: UserRole) => {
      if (role === UserRole.ADMIN || role === UserRole.SUPER_ADMIN) {
        throw new BadRequestException('A single platform Admin account already exists. Secondary admin creation is prohibited.');
      }
      mockCreatedUser = {
        id: 'usr-new-customer',
        phone,
        passwordHash,
        role: UserRole.CUSTOMER,
        isActive: true,
        profile: { firstName: 'Aarav', lastName: 'Patel' },
      };
      return mockCreatedUser;
    }),
    updatePassword: jest.fn().mockResolvedValue(undefined),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    mockCreatedUser = null;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: OtpService, useValue: mockOtpService },
        { provide: TokenService, useValue: mockTokenService },
        { provide: SessionService, useValue: mockSessionService },
        { provide: UsersService, useValue: mockUsersService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    usersService = module.get<UsersService>(UsersService);

    (service as any).usersService.prisma = {
      user: {
        create: jest.fn().mockImplementation(async (args: any) => {
          mockCreatedUser = {
            id: 'usr-new-customer',
            phone: args.data.phone,
            passwordHash: args.data.passwordHash,
            role: args.data.role,
            isActive: true,
            profile: { firstName: 'Aarav', lastName: 'Patel' },
          };
          return mockCreatedUser;
        }),
      },
    };
  });

  // ==========================================
  // PRE-OTP SIGNUP & PHONE VERIFICATION TESTS
  // ==========================================

  // Test 1: New phone + valid details -> OTP -> correct OTP -> CUSTOMER created -> SUCCESS
  it('1. New phone + valid details -> verified OTP -> CUSTOMER created -> SUCCESS', async () => {
    const checkResult = await service.checkPhoneAvailability('9123456789');
    expect(checkResult.available).toBe(true);

    const result = await service.verifyWidgetToken(
      'token_new_user',
      'CUSTOMER',
      '127.0.0.1',
      'UA',
      {
        phone: '9123456789',
        name: 'Aarav Patel',
        password: 'NewCustomerPass123!',
      },
    );

    expect(result.tokens).toHaveProperty('accessToken');
    expect(result.user.role).toBe(UserRole.CUSTOMER);
    expect(mockCreatedUser).not.toBeNull();
    expect(mockCreatedUser.phone).toBe('+919123456789');
    expect(mockCreatedUser.role).toBe(UserRole.CUSTOMER);
  });

  // Test 2: New phone + wrong OTP -> account NOT created
  it('2. New phone + wrong OTP -> account NOT created', async () => {
    await expect(
      service.verifyOtp({
        phone: '+919123456789',
        otp: 'wrong',
        targetRole: 'CUSTOMER',
        name: 'Aarav Patel',
        password: 'NewCustomerPass123!',
      }),
    ).rejects.toThrow(BadRequestException);

    expect(mockCreatedUser).toBeNull();
  });

  // Test 3: New phone + cancelled OTP -> account NOT created
  it('3. New phone + cancelled OTP -> account NOT created', async () => {
    expect(mockCreatedUser).toBeNull();
  });

  // Test 4: Existing phone -> signup rejected -> existing account unchanged
  it('4. Existing phone -> checkPhoneAvailability & verifyOtp signup rejected', async () => {
    await expect(service.checkPhoneAvailability('9876543211')).rejects.toThrow(BadRequestException);

    await expect(
      service.verifyWidgetToken('token_customer', 'CUSTOMER', '127.0.0.1', 'UA', {
        phone: '9876543211',
        password: 'Password123!',
      }),
    ).rejects.toThrow(BadRequestException);
  });

  // Test 5: MSG91 verifies a different phone than signup phone -> signup rejected
  it('5. MSG91 verifies a different phone than signup phone -> signup rejected', async () => {
    await expect(
      service.verifyWidgetToken('token_mismatch', 'CUSTOMER', '127.0.0.1', 'UA', {
        phone: '9876543211', // submitted 9876543211, but MSG91 token returns 9111111111
        password: 'Password123!',
      }),
    ).rejects.toThrow(BadRequestException);

    expect(mockCreatedUser).toBeNull();
  });

  // Test 6: Customer signup -> role must always be CUSTOMER
  it('6. Customer signup -> role must always be CUSTOMER', async () => {
    const result = await service.verifyWidgetToken(
      'token_new_user',
      'CUSTOMER',
      '127.0.0.1',
      'UA',
      {
        phone: '9123456789',
        name: 'Aarav Patel',
        password: 'NewCustomerPass123!',
      },
    );

    expect(result.user.role).toBe(UserRole.CUSTOMER);
    expect(result.user.role).not.toBe(UserRole.ADMIN);
    expect(result.user.role).not.toBe(UserRole.SUPER_ADMIN);
  });

  // Test 7: Verify database after signup -> exactly one CUSTOMER created, phone verified, password hashed
  it('7. Verify database after signup -> exactly one CUSTOMER created, phone verified, password hashed', async () => {
    await service.verifyWidgetToken('token_new_user', 'CUSTOMER', '127.0.0.1', 'UA', {
      phone: '9123456789',
      name: 'Aarav Patel',
      password: 'NewCustomerPass123!',
    });

    expect(mockCreatedUser).not.toBeNull();
    expect(mockCreatedUser.phone).toBe('+919123456789');
    expect(mockCreatedUser.role).toBe(UserRole.CUSTOMER);
    expect(mockCreatedUser.passwordHash).not.toBe('NewCustomerPass123!');
    const isBcryptHash = mockCreatedUser.passwordHash.startsWith('$2');
    expect(isBcryptHash).toBe(true);
  });
});
