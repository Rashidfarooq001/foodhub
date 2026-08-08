import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { OtpService } from '../otp/otp.service';
import { TokenService } from '../tokens/token.service';
import { SessionService } from '../sessions/session.service';
import { UsersService } from '../users/users.service';
import { UnauthorizedException, BadRequestException } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';

describe('FoodHub MSG91 Widget Forgot Password & Reset Authorization Test Suite', () => {
  let service: AuthService;
  let usersService: UsersService;

  let mockCustomerUser = {
    id: 'usr-customer-1',
    phone: '+919876543211',
    email: 'customer@foodhub.com',
    passwordHash: '$2b$12$e83B1m5zP6GqLpM0sK5xOuF6R7L9N0V2Z4Y6X8W0V2Z4Y6X8W0V2Z', // OldPass123!
    role: UserRole.CUSTOMER,
    isActive: true,
    profile: { firstName: 'Rahul', lastName: 'Sharma' },
  };

  const mockOtpService = {
    sendOtp: jest.fn().mockResolvedValue({ message: 'OTP sent', cooldownSec: 60 }),
    verifyOtp: jest.fn().mockImplementation(async (phone: string, otp: string) => {
      if (otp === 'wrong' || otp === '0000') {
        throw new BadRequestException('Invalid or expired OTP');
      }
      return true;
    }),
    verifyAccessToken: jest.fn().mockImplementation(async (token: string) => {
      if (token === 'token_invalid') throw new BadRequestException('Invalid MSG91 access token');
      return {
        type: 'success',
        message: token.includes('mismatch') ? '+919111111111' : '+919876543211',
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

  const mockUsersService = {
    findUserByPhone: jest.fn().mockImplementation(async (phone: string) => {
      if (phone === '+919876543211') return mockCustomerUser;
      return null;
    }),
    findUserByPhoneOrEmail: jest.fn().mockImplementation(async (input: string) => {
      const clean = input.replace(/\D/g, '');
      if (input === '+919876543211' || input === 'customer@foodhub.com' || clean === '9876543211') return mockCustomerUser;
      return null;
    }),
    findUserById: jest.fn().mockImplementation(async (id: string) => {
      if (id === 'usr-customer-1') return mockCustomerUser;
      return null;
    }),
    updatePassword: jest.fn().mockImplementation(async (id: string, newHash: string) => {
      mockCustomerUser.passwordHash = newHash;
    }),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    mockCustomerUser.passwordHash = await bcrypt.hash('OldPass123!', 12);

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
  });

  // Test 1: Correct registered customer phone -> OTP sent
  it('1. Correct registered customer phone -> OTP sent', async () => {
    const res = await service.forgotPassword('9876543211');
    expect(res.exists).toBe(true);
    expect(mockOtpService.sendOtp).toHaveBeenCalledWith('+919876543211');
  });

  // Test 2: Correct OTP -> MSG91 success -> verifyResetToken -> short-lived resetToken issued
  it('2. Correct OTP -> MSG91 success -> verifyResetToken -> short-lived resetToken issued', async () => {
    const res = await service.verifyResetToken({
      accessToken: 'token_valid_customer',
      phone: '9876543211',
    });

    expect(res).toHaveProperty('resetToken');
    expect(res.resetToken).toContain('rst_');
    expect(res.phone).toBe('+919876543211');
  });

  // Test 3: Wrong OTP -> rejected
  it('3. Wrong OTP -> rejected', async () => {
    await expect(
      service.verifyResetToken({
        phone: '9876543211',
        otp: 'wrong',
      }),
    ).rejects.toThrow(BadRequestException);
  });

  // Test 4: Expired or invalid MSG91 access token -> rejected
  it('4. Invalid or expired MSG91 access token -> rejected', async () => {
    await expect(
      service.verifyResetToken({
        accessToken: 'token_invalid',
        phone: '9876543211',
      }),
    ).rejects.toThrow(BadRequestException);
  });

  // Test 5: Correct OTP for another phone -> phone mismatch -> rejected
  it('5. Correct OTP for another phone -> phone mismatch -> rejected', async () => {
    await expect(
      service.verifyResetToken({
        accessToken: 'token_mismatch', // returns +919111111111
        phone: '9876543211', // requested +919876543211
      }),
    ).rejects.toThrow(BadRequestException);
  });

  // Test 6: Unknown phone -> generic response, no account created
  it('6. Unknown phone -> safe generic response', async () => {
    const res = await service.forgotPassword('8888888888');
    expect(res.exists).toBeUndefined();
    expect(res.message).toContain('If registered');
  });

  // Test 7: New password -> resetPassword with valid resetToken succeeds
  it('7. New password -> resetPassword with valid resetToken succeeds', async () => {
    const tokenRes = await service.verifyResetToken({
      accessToken: 'token_valid_customer',
      phone: '9876543211',
    });

    const resetRes = await service.resetPassword({
      resetToken: tokenRes.resetToken,
      newPassword: 'BrandNewPassword123!',
    });

    expect(resetRes.tokens).toHaveProperty('accessToken');
    expect(mockTokenService.revokeAllUserTokens).toHaveBeenCalledWith('usr-customer-1');
  });

  // Test 8: Old password -> login fails with old password
  it('8. Old password -> login fails after password reset', async () => {
    const tokenRes = await service.verifyResetToken({
      accessToken: 'token_valid_customer',
      phone: '9876543211',
    });

    await service.resetPassword({
      resetToken: tokenRes.resetToken,
      newPassword: 'BrandNewPassword123!',
    });

    await expect(
      service.login({
        phone: '9876543211',
        password: 'OldPass123!',
      }),
    ).rejects.toThrow(UnauthorizedException);
  });

  // Test 9: New password -> login succeeds with new password
  it('9. New password -> login succeeds after password reset', async () => {
    const tokenRes = await service.verifyResetToken({
      accessToken: 'token_valid_customer',
      phone: '9876543211',
    });

    await service.resetPassword({
      resetToken: tokenRes.resetToken,
      newPassword: 'BrandNewPassword123!',
    });

    const loginRes = await service.login({
      phone: '9876543211',
      password: 'BrandNewPassword123!',
    });

    expect(loginRes.tokens).toHaveProperty('accessToken');
    expect(loginRes.user.phone).toBe('+919876543211');
  });

  // Test 10: Single-use reset authorization token cannot be reused
  it('10. Single-use resetToken cannot be reused', async () => {
    const tokenRes = await service.verifyResetToken({
      accessToken: 'token_valid_customer',
      phone: '9876543211',
    });

    // First use: succeeds
    await service.resetPassword({
      resetToken: tokenRes.resetToken,
      newPassword: 'BrandNewPassword123!',
    });

    // Second use: fails because token was invalidated
    await expect(
      service.resetPassword({
        resetToken: tokenRes.resetToken,
        newPassword: 'AnotherPassword123!',
      }),
    ).rejects.toThrow(BadRequestException);
  });
});
