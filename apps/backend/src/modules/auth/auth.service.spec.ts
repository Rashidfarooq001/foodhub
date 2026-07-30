import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { OtpService } from '../otp/otp.service';
import { TokenService } from '../tokens/token.service';
import { SessionService } from '../sessions/session.service';
import { UsersService } from '../users/users.service';

describe('AuthService', () => {
  let service: AuthService;

  const mockOtpService = {
    sendOtp: jest.fn().mockResolvedValue({ message: 'OTP sent', cooldownSec: 60 }),
    verifyOtp: jest.fn().mockResolvedValue(true),
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
    findUserByPhone: jest.fn().mockResolvedValue(null),
    createUser: jest.fn().mockResolvedValue({
      id: 'usr-uuid-1',
      phone: '+919876543210',
      role: 'CUSTOMER',
      profile: { firstName: 'Customer' },
    }),
  };

  beforeEach(async () => {
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

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should dispatch OTP via sendOtp()', async () => {
    const result = await service.sendOtp('+919876543210');
    expect(result).toEqual({ message: 'OTP sent', cooldownSec: 60 });
    expect(mockOtpService.sendOtp).toHaveBeenCalledWith('+919876543210');
  });

  it('should verify OTP and return tokens via verifyOtp()', async () => {
    const result = await service.verifyOtp('+919876543210', '4819');
    expect(result.tokens).toHaveProperty('accessToken');
    expect(result.user.phone).toBe('+919876543210');
  });
});
