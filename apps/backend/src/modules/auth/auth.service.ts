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
    const input = (dto.phone || dto.email || '').trim();
    if (!input) {
      throw new BadRequestException('Phone or email is required for login');
    }
    const user = await this.usersService.findUserByPhoneOrEmail(input);
    if (!user || !user.isActive) {
      throw new UnauthorizedException('Invalid credentials or account disabled');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials entered');
    }

    let restaurant: any = null;
    if (
      user.role === UserRole.RESTAURANT_OWNER ||
      user.role === UserRole.RESTAURANT_MANAGER ||
      user.role === UserRole.RESTAURANT_STAFF
    ) {
      let rObj = (user as any).restaurantStaff?.[0]?.restaurant;
      if (!rObj && user.role === UserRole.RESTAURANT_OWNER) {
        rObj = await (this.usersService as any).prisma.restaurant.findFirst({
          where: { ownerId: user.id },
        });
      }

      if (rObj) {
        if (rObj.status === 'PENDING_APPROVAL') {
          throw new UnauthorizedException('Your restaurant application is currently pending admin approval.');
        }
        if (rObj.status === 'REJECTED') {
          throw new UnauthorizedException('Your restaurant application has been rejected by FoodHub admin.');
        }
        restaurant = {
          id: rObj.id,
          name: rObj.name,
          slug: rObj.slug,
          status: rObj.status,
          deliveryMode: rObj.deliveryMode,
        };
      }
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
        restaurant,
        restaurantId: restaurant?.id,
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

  async forgotPassword(input: string) {
    const user = await this.usersService.findUserByPhoneOrEmail(input);
    if (!user) {
      // Security standard: generic success response to prevent enumeration
      return { message: 'If registered, reset OTP has been sent' };
    }
    return this.otpService.sendOtp(user.phone);
  }

  async resetPassword(dto: ResetPasswordDto) {
    const input = (dto.phone || dto.email || '').trim();
    const user = await this.usersService.findUserByPhoneOrEmail(input);
    if (!user) {
      throw new BadRequestException('User record not found');
    }

    await this.otpService.verifyOtp(user.phone, dto.otp);

    const newPasswordHash = await bcrypt.hash(dto.newPassword, 12);
    await this.usersService.updatePassword(user.id, newPasswordHash);

    // Invalidate old refresh tokens and sessions for security
    await this.tokenService.revokeAllUserTokens(user.id);
    await this.sessionService.terminateAllUserSessions(user.id);

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
