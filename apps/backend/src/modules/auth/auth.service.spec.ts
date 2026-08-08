import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { OtpService } from '../otp/otp.service';
import { TokenService } from '../tokens/token.service';
import { SessionService } from '../sessions/session.service';
import { UsersService } from '../users/users.service';
import { UnauthorizedException } from '@nestjs/common';

describe('AuthService Role-Aware MSG91 OTP Tests', () => {
  let service: AuthService;

  const mockOtpService = {
    sendOtp: jest.fn().mockResolvedValue({ message: 'OTP sent', cooldownSec: 60 }),
    verifyOtp: jest.fn().mockResolvedValue(true),
    verifyAccessToken: jest.fn().mockResolvedValue({
      type: 'success',
      message: '919876543210',
    }),
  };

  const mockTokenService = {
    generateTokenPair: jest.fn().mockResolvedValue({
      accessToken: 'mock-access-token',
      refreshToken: 'mock-refresh-token',
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
    findUserByPhone: jest.fn(),
    createUser: jest.fn().mockResolvedValue({
      id: 'usr-customer-1',
      phone: '+919876543210',
      role: 'CUSTOMER',
      isActive: true,
      profile: { firstName: 'Customer' },
    }),
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
  });

  it('should auto-register unknown phone for CUSTOMER targetRole', async () => {
    mockUsersService.findUserByPhone.mockResolvedValueOnce(null);

    const result = await service.verifyWidgetToken('widget-token-123', 'CUSTOMER');
    expect(result.tokens).toHaveProperty('accessToken');
    expect(result.user.role).toBe('CUSTOMER');
    expect(mockUsersService.createUser).toHaveBeenCalled();
  });

  it('should reject unknown phone for HOTEL targetRole', async () => {
    mockUsersService.findUserByPhone.mockResolvedValueOnce(null);

    await expect(
      service.verifyWidgetToken('widget-token-123', 'HOTEL'),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('should reject unknown phone for DELIVERY targetRole', async () => {
    mockUsersService.findUserByPhone.mockResolvedValueOnce(null);

    await expect(
      service.verifyWidgetToken('widget-token-123', 'DELIVERY'),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('should reject unknown phone for ADMIN targetRole', async () => {
    mockUsersService.findUserByPhone.mockResolvedValueOnce(null);

    await expect(
      service.verifyWidgetToken('widget-token-123', 'ADMIN'),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('should allow valid RESTAURANT_OWNER to login to HOTEL dashboard', async () => {
    mockUsersService.findUserByPhone.mockResolvedValueOnce({
      id: 'usr-owner-1',
      phone: '+919876543210',
      role: 'RESTAURANT_OWNER',
      isActive: true,
    });

    const result = await service.verifyWidgetToken('widget-token-123', 'HOTEL');
    expect(result.tokens).toHaveProperty('accessToken');
    expect(result.user.role).toBe('RESTAURANT_OWNER');
  });

  it('should reject CUSTOMER role attempting to login to ADMIN dashboard', async () => {
    mockUsersService.findUserByPhone.mockResolvedValueOnce({
      id: 'usr-customer-1',
      phone: '+919876543210',
      role: 'CUSTOMER',
      isActive: true,
    });

    await expect(
      service.verifyWidgetToken('widget-token-123', 'ADMIN'),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('should allow valid ADMIN to login to ADMIN dashboard', async () => {
    mockUsersService.findUserByPhone.mockResolvedValueOnce({
      id: 'usr-admin-1',
      phone: '+919876543210',
      role: 'ADMIN',
      isActive: true,
    });

    const result = await service.verifyWidgetToken('widget-token-123', 'ADMIN');
    expect(result.tokens).toHaveProperty('accessToken');
    expect(result.user.role).toBe('ADMIN');
  });
});
