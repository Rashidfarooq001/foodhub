import { Test, TestingModule } from '@nestjs/testing';
import { OtpService } from './otp.service';
import { PrismaService } from '../database/prisma.service';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';

describe('OtpService', () => {
  let service: OtpService;

  const mockPrismaService = {
    otp: {
      findFirst: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockResolvedValue({ id: 'otp-1' }),
      update: jest.fn().mockResolvedValue({ id: 'otp-1', isUsed: true }),
    },
  };

  const mockHttpService = {
    post: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn().mockReturnValue('dummy_key'),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OtpService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: HttpService, useValue: mockHttpService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<OtpService>(OtpService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should generate and save hashed OTP on sendOtp()', async () => {
    const res = await service.sendOtp('+919876543210');
    expect(res.cooldownSec).toBe(60);
    expect(mockPrismaService.otp.create).toHaveBeenCalled();
  });
});
