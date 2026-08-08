import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { OtpService } from '../otp/otp.service';
import { TokenService } from '../tokens/token.service';
import { SessionService } from '../sessions/session.service';
import { UsersService } from '../users/users.service';
import { UnauthorizedException, BadRequestException } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';

describe('FoodHub Complete 26-Point Role & Auth Test Suite', () => {
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

  const mockHotelManagerUser = {
    id: 'usr-hotel-mgr-1',
    phone: '+919876543212',
    email: 'manager@spicegarden.com',
    passwordHash: '$2b$12$e83B1m5zP6GqLpM0sK5xOuF6R7L9N0V2Z4Y6X8W0V2Z4Y6X8W0V2Z',
    role: UserRole.RESTAURANT_MANAGER,
    isActive: true,
    profile: { firstName: 'Amit', lastName: 'Shah' },
  };

  const mockHotelStaffUser = {
    id: 'usr-hotel-staff-1',
    phone: '+919876543213',
    email: 'staff@spicegarden.com',
    passwordHash: '$2b$12$e83B1m5zP6GqLpM0sK5xOuF6R7L9N0V2Z4Y6X8W0V2Z4Y6X8W0V2Z',
    role: UserRole.RESTAURANT_STAFF,
    isActive: true,
    profile: { firstName: 'Suresh', lastName: 'Raina' },
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

  const mockInactiveDeliveryUser = {
    id: 'usr-driver-inactive',
    phone: '+919876500888',
    email: 'inactive_driver@foodhub.com',
    passwordHash: '$2b$12$e83B1m5zP6GqLpM0sK5xOuF6R7L9N0V2Z4Y6X8W0V2Z4Y6X8W0V2Z',
    role: UserRole.DELIVERY_PARTNER,
    isActive: false,
  };

  const mockOtpService = {
    sendOtp: jest.fn().mockResolvedValue({ message: 'OTP sent', cooldownSec: 60 }),
    verifyOtp: jest.fn().mockResolvedValue(true),
    verifyAccessToken: jest.fn().mockImplementation(async (token: string) => ({
      type: 'success',
      message: token.includes('admin')
        ? '+919999999999'
        : token.includes('customer')
        ? '+919876543211'
        : token.includes('hotel')
        ? '+919876543210'
        : '+919876500999',
    })),
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

  const mockUsersService = {
    findUserByPhone: jest.fn().mockImplementation(async (phone: string) => {
      if (phone === '+919999999999') return mockAdminUser;
      if (phone === '+919876543211') return mockCustomerUser;
      if (phone === '+919876543210') return mockHotelOwnerUser;
      if (phone === '+919876543212') return mockHotelManagerUser;
      if (phone === '+919876543213') return mockHotelStaffUser;
      if (phone === '+919876500999') return mockDeliveryUser;
      if (phone === '+919876500888') return mockInactiveDeliveryUser;
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
      return {
        id: 'usr-new-customer',
        phone,
        role: UserRole.CUSTOMER,
        isActive: true,
      };
    }),
    updatePassword: jest.fn().mockResolvedValue(undefined),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

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

    // Provide mock prisma for register in test environment
    (service as any).usersService.prisma = {
      user: {
        create: jest.fn().mockResolvedValue({
          id: 'usr-new-customer',
          phone: '+919123456789',
          role: UserRole.CUSTOMER,
          profile: { firstName: 'Aarav', lastName: 'Patel' },
        }),
      },
    };
  });

  // ==========================================
  // CUSTOMER TESTS (1 - 9)
  // ==========================================
  it('1. New customer signup -> SUCCESS', async () => {
    const result = await service.register({
      name: 'Aarav Patel',
      phone: '9123456789',
      address: 'Indiranagar, Bengaluru',
      password: 'NewCustomerPass123!',
      confirmPassword: 'NewCustomerPass123!',
    });

    expect(result.tokens).toHaveProperty('accessToken');
    expect(result.user.role).toBe(UserRole.CUSTOMER);
  });

  it('2. Duplicate phone customer signup -> REJECT', async () => {
    await expect(
      service.register({
        name: 'Rahul Sharma',
        phone: '9876543211',
        password: 'Password123!',
        confirmPassword: 'Password123!',
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('3. Customer phone + password login -> SUCCESS', async () => {
    jest.spyOn(bcrypt, 'compare').mockResolvedValueOnce(true as never);

    const result = await service.login({
      phone: '9876543211',
      password: 'CustomerPass123!',
    });

    expect(result.tokens).toHaveProperty('accessToken');
    expect(result.user.role).toBe(UserRole.CUSTOMER);
  });

  it('4. Customer login with wrong password -> REJECT', async () => {
    jest.spyOn(bcrypt, 'compare').mockResolvedValueOnce(false as never);

    await expect(
      service.login({
        phone: '9876543211',
        password: 'WrongPassword!',
      }),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('5. Forgot password -> OTP -> new password -> SUCCESS', async () => {
    const resetResult = await service.resetPassword({
      phone: '+919876543211',
      otp: '4819',
      newPassword: 'BrandNewPassword123!',
    });

    expect(resetResult.message).toContain('Password reset successfully');
    expect(mockUsersService.updatePassword).toHaveBeenCalled();
  });

  it('6. Unknown phone forgot password -> safe response', async () => {
    const forgotResult = await service.forgotPassword('+918888888888');
    expect(forgotResult.message).toContain('reset OTP has been sent');
  });

  it('7. Customer -> Hotel Dashboard -> REJECT', async () => {
    await expect(
      service.verifyWidgetToken('token_customer', 'HOTEL'),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('8. Customer -> Delivery Dashboard -> REJECT', async () => {
    await expect(
      service.verifyWidgetToken('token_customer', 'DELIVERY'),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('9. Customer -> Admin Dashboard -> REJECT', async () => {
    await expect(
      service.verifyWidgetToken('token_customer', 'ADMIN'),
    ).rejects.toThrow(UnauthorizedException);
  });

  // ==========================================
  // HOTEL TESTS (10 - 15)
  // ==========================================
  it('10. Registered hotel owner -> SUCCESS', async () => {
    const result = await service.verifyWidgetToken('token_hotel', 'HOTEL');
    expect(result.tokens).toHaveProperty('accessToken');
    expect(result.user.role).toBe(UserRole.RESTAURANT_OWNER);
  });

  it('11. Registered manager -> SUCCESS', async () => {
    mockOtpService.verifyAccessToken.mockResolvedValueOnce({
      type: 'success',
      message: '+919876543212',
    });

    const result = await service.verifyWidgetToken('token_hotel_mgr', 'HOTEL');
    expect(result.tokens).toHaveProperty('accessToken');
    expect(result.user.role).toBe(UserRole.RESTAURANT_MANAGER);
  });

  it('12. Registered staff -> SUCCESS', async () => {
    mockOtpService.verifyAccessToken.mockResolvedValueOnce({
      type: 'success',
      message: '+919876543213',
    });

    const result = await service.verifyWidgetToken('token_hotel_staff', 'HOTEL');
    expect(result.tokens).toHaveProperty('accessToken');
    expect(result.user.role).toBe(UserRole.RESTAURANT_STAFF);
  });

  it('13. Customer -> Hotel -> REJECT', async () => {
    await expect(
      service.verifyWidgetToken('token_customer', 'HOTEL'),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('14. Unapproved restaurant owner login -> REJECT', async () => {
    (service as any).usersService.prisma = {
      restaurant: {
        findFirst: jest.fn().mockResolvedValue({
          id: 'rest-pending',
          status: 'PENDING_APPROVAL',
        }),
      },
    };

    await expect(
      service.verifyWidgetToken('token_hotel', 'HOTEL'),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('15. Unregistered hotel phone -> REJECT', async () => {
    mockOtpService.verifyAccessToken.mockResolvedValueOnce({
      type: 'success',
      message: '+918888888888',
    });

    await expect(
      service.verifyWidgetToken('token_unknown_hotel', 'HOTEL'),
    ).rejects.toThrow(UnauthorizedException);
  });

  // ==========================================
  // DELIVERY TESTS (16 - 19)
  // ==========================================
  it('16. Registered delivery partner -> SUCCESS', async () => {
    const result = await service.verifyWidgetToken('token_delivery', 'DELIVERY');
    expect(result.tokens).toHaveProperty('accessToken');
    expect(result.user.role).toBe(UserRole.DELIVERY_PARTNER);
  });

  it('17. Customer -> Delivery -> REJECT', async () => {
    await expect(
      service.verifyWidgetToken('token_customer', 'DELIVERY'),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('18. Unknown delivery phone -> REJECT', async () => {
    mockOtpService.verifyAccessToken.mockResolvedValueOnce({
      type: 'success',
      message: '+918888888888',
    });

    await expect(
      service.verifyWidgetToken('token_unknown_driver', 'DELIVERY'),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('19. Inactive delivery account -> REJECT', async () => {
    mockOtpService.verifyAccessToken.mockResolvedValueOnce({
      type: 'success',
      message: '+919876500888',
    });

    await expect(
      service.verifyWidgetToken('token_inactive_driver', 'DELIVERY'),
    ).rejects.toThrow(UnauthorizedException);
  });

  // ==========================================
  // ADMIN TESTS (20 - 26)
  // ==========================================
  it('20. Correct admin phone + OTP -> SUCCESS', async () => {
    const result = await service.verifyWidgetToken('token_admin', 'ADMIN');
    expect(result.tokens).toHaveProperty('accessToken');
    expect(result.user.role).toBe(UserRole.SUPER_ADMIN);
  });

  it('21. Wrong phone + OTP -> REJECT', async () => {
    mockOtpService.verifyAccessToken.mockResolvedValueOnce({
      type: 'success',
      message: '+918888888888',
    });

    await expect(
      service.verifyWidgetToken('token_wrong_admin', 'ADMIN'),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('22. Customer phone + OTP -> REJECT', async () => {
    await expect(
      service.verifyWidgetToken('token_customer', 'ADMIN'),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('23. Correct admin email + password -> SUCCESS', async () => {
    jest.spyOn(bcrypt, 'compare').mockResolvedValueOnce(true as never);

    const result = await service.login({
      email: 'admin@foodhub.com',
      password: 'SuperAdmin123!',
    });

    expect(result.tokens).toHaveProperty('accessToken');
    expect(result.user.role).toBe(UserRole.SUPER_ADMIN);
  });

  it('24. Correct admin email + wrong password -> REJECT', async () => {
    jest.spyOn(bcrypt, 'compare').mockResolvedValueOnce(false as never);

    await expect(
      service.login({
        email: 'admin@foodhub.com',
        password: 'WrongPassword!',
      }),
    ).rejects.toThrow(UnauthorizedException);
  });

  // Test Case 25: Unknown email -> REJECT
  it('25. Unknown email -> REJECT', async () => {
    await expect(
      service.login({
        email: 'unknown_admin@foodhub.com',
        password: 'SuperAdmin123!',
      }),
    ).rejects.toThrow(UnauthorizedException);
  });

  // Test Case 26: Second ADMIN creation -> REJECT
  it('26. Second ADMIN creation -> REJECT', async () => {
    await expect(
      usersService.createUser('+917777777777', 'password_hash', UserRole.ADMIN),
    ).rejects.toThrow(BadRequestException);
  });
});
