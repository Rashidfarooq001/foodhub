import { Injectable, UnauthorizedException, BadRequestException, Logger } from '@nestjs/common';
import { OtpService } from '../otp/otp.service';
import { TokenService } from '../tokens/token.service';
import { SessionService } from '../sessions/session.service';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import * as bcrypt from 'bcrypt';
import { UserRole } from '@prisma/client';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly otpService: OtpService,
    private readonly tokenService: TokenService,
    private readonly sessionService: SessionService,
    private readonly usersService: UsersService,
  ) {}

  async sendOtp(phone: string) {
    return this.otpService.sendOtp(phone);
  }

  async verifyOtp(phone: string, otp: string, ipAddress?: string, userAgent?: string) {
    await this.otpService.verifyOtp(phone, otp);

    let user = await this.usersService.findUserByPhone(phone);
    if (!user) {
      // Auto-register Customer upon first successful OTP verification
      const dummyPassword = await bcrypt.hash(`Customer@${Date.now()}`, 12);
      user = await this.usersService.createUser(phone, dummyPassword, UserRole.CUSTOMER);
    }

    const session = await this.sessionService.createSession(user.id, ipAddress, userAgent);
    const tokens = await this.tokenService.generateTokenPair(user, session.id);

    return {
      user: {
        id: user.id,
        phone: user.phone,
        email: user.email,
        role: user.role,
        profile: user.profile,
      },
      tokens,
    };
  }

  async login(dto: LoginDto, ipAddress?: string, userAgent?: string) {
    const user = await this.usersService.findUserByPhone(dto.phone);
    if (!user || !user.isActive) {
      throw new UnauthorizedException('Invalid phone number or account disabled');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials entered');
    }

    // Require 2FA OTP for Admin / SuperAdmin roles
    if (user.role === UserRole.ADMIN || user.role === UserRole.SUPER_ADMIN) {
      if (!dto.otp) {
        // Trigger 2FA OTP send
        const otpRes = await this.otpService.sendOtp(user.phone);
        return {
          requires2FA: true,
          message: '2FA OTP code dispatched to registered mobile number',
          ...(otpRes.otp ? { otp: otpRes.otp } : {}),
        };
      }
      await this.otpService.verifyOtp(user.phone, dto.otp);
    }

    const session = await this.sessionService.createSession(user.id, ipAddress, userAgent);
    const tokens = await this.tokenService.generateTokenPair(user, session.id);

    return {
      user: {
        id: user.id,
        phone: user.phone,
        email: user.email,
        role: user.role,
        profile: user.profile,
      },
      tokens,
    };
  }

  async logout(userId: string, sessionId: string) {
    await this.sessionService.terminateSession(sessionId, userId);
    return { message: 'Logged out successfully' };
  }

  async logoutAll(userId: string) {
    await this.tokenService.revokeAllUserTokens(userId);
    await this.sessionService.terminateAllUserSessions(userId);
    return { message: 'Logged out from all devices successfully' };
  }

  async refresh(refreshToken: string) {
    return this.tokenService.rotateRefreshToken(refreshToken);
  }

  async forgotPassword(phone: string) {
    const user = await this.usersService.findUserByPhone(phone);
    if (!user) {
      // Security standard: generic success response to prevent phone enumeration
      return { message: 'If registered, reset OTP has been sent' };
    }
    return this.otpService.sendOtp(phone);
  }

  async resetPassword(dto: ResetPasswordDto) {
    await this.otpService.verifyOtp(dto.phone, dto.otp);

    const user = await this.usersService.findUserByPhone(dto.phone);
    if (!user) {
      throw new BadRequestException('User record not found');
    }

    const newPasswordHash = await bcrypt.hash(dto.newPassword, 12);
    await this.usersService.updatePassword(user.id, newPasswordHash);

    // Invalidate old refresh tokens for security
    await this.tokenService.revokeAllUserTokens(user.id);

    return { message: 'Password reset successfully. Please login with your new password' };
  }

  async changePassword(userId: string, dto: ChangePasswordDto) {
    const user = await this.usersService.findUserById(userId);

    const isMatch = await bcrypt.compare(dto.currentPassword, user.passwordHash);
    if (!isMatch) {
      throw new BadRequestException('Current password does not match');
    }

    const newPasswordHash = await bcrypt.hash(dto.newPassword, 12);
    await this.usersService.updatePassword(user.id, newPasswordHash);

    return { message: 'Password updated successfully' };
  }

  async getProfile(userId: string) {
    return this.usersService.findUserById(userId);
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    return this.usersService.updateProfile(userId, dto);
  }
}
