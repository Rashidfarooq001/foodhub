import { Injectable, UnauthorizedException, BadRequestException, Logger } from '@nestjs/common';
import { OtpService } from '../otp/otp.service';
import { TokenService } from '../tokens/token.service';
import { SessionService } from '../sessions/session.service';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import * as bcrypt from 'bcrypt';
import { UserRole } from '@prisma/client';

import { VerifyOtpDto } from './dto/verify-otp.dto';

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

  async register(dto: RegisterDto, ipAddress?: string, userAgent?: string) {
    if (dto.password !== dto.confirmPassword) {
      throw new BadRequestException('Passwords do not match');
    }

    const cleanDigits = dto.phone.replace(/\D/g, '');
    if (cleanDigits.length < 10) {
      throw new BadRequestException('Please provide a valid 10-digit mobile number');
    }

    const formattedPhone = cleanDigits.length === 10 ? `+91${cleanDigits}` : `+${cleanDigits}`;

    const existingUser = await this.usersService.findUserByPhone(formattedPhone);
    if (existingUser) {
      throw new BadRequestException('Phone number is already registered. Please login.');
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);
    const nameParts = dto.name.trim().split(' ');
    const firstName = nameParts[0] || 'Customer';
    const lastName = nameParts.slice(1).join(' ') || '';

    // Create ONLY CUSTOMER user
    const user = await (this.usersService as any).prisma.user.create({
      data: {
        phone: formattedPhone,
        passwordHash,
        role: UserRole.CUSTOMER,
        isVerified: true,
        isActive: true,
        profile: {
          create: {
            firstName,
            lastName,
          },
        },
      },
      include: { profile: true },
    });

    this.logger.log(`[Customer Register] Registered new Customer ID=${user.id}, phone=${user.phone}`);
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

  private async enforceUserRoleAndStatus(user: any, targetRole?: string) {
    const normalizedTarget = (targetRole || 'CUSTOMER').toUpperCase();

    if (!user.isActive) {
      throw new UnauthorizedException('Account is disabled. Please contact support.');
    }

    if (normalizedTarget === 'HOTEL') {
      const allowedHotelRoles: string[] = [
        UserRole.RESTAURANT_OWNER,
        UserRole.RESTAURANT_MANAGER,
        UserRole.RESTAURANT_STAFF,
      ];
      if (!allowedHotelRoles.includes(user.role)) {
        throw new UnauthorizedException(
          'Access denied. Your account is not authorized for the Merchant Partner Portal.',
        );
      }
    } else if (normalizedTarget === 'DELIVERY') {
      if (user.role !== UserRole.DELIVERY_PARTNER) {
        throw new UnauthorizedException(
          'Access denied. Your account is not authorized for the Courier Partner Portal.',
        );
      }
    } else if (normalizedTarget === 'ADMIN') {
      const allowedAdminRoles: string[] = [UserRole.ADMIN, UserRole.SUPER_ADMIN];
      if (!allowedAdminRoles.includes(user.role)) {
        throw new UnauthorizedException(
          'Access denied. Your account does not have administrative privileges.',
        );
      }
    }

    // Fetch restaurant association for Hotel roles
    let restaurant: any = null;
    if (
      user.role === UserRole.RESTAURANT_OWNER ||
      user.role === UserRole.RESTAURANT_MANAGER ||
      user.role === UserRole.RESTAURANT_STAFF
    ) {
      let rObj = (user as any).restaurantStaff?.[0]?.restaurant;
      if (!rObj && user.role === UserRole.RESTAURANT_OWNER) {
        rObj = await (this.usersService as any).prisma?.restaurant?.findFirst({
          where: { ownerId: user.id },
        });
      }

      if (rObj) {
        if (rObj.status === 'PENDING_APPROVAL') {
          throw new UnauthorizedException(
            'Your restaurant application is currently pending admin approval.',
          );
        }
        if (rObj.status === 'REJECTED') {
          throw new UnauthorizedException(
            'Your restaurant application has been rejected by FoodHub admin.',
          );
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

    return restaurant;
  }

  async verifyWidgetToken(
    accessToken: string,
    targetRole?: string,
    ipAddress?: string,
    userAgent?: string,
  ) {
    if (!accessToken) {
      throw new BadRequestException('Widget access token is required');
    }

    const msg91Data = await this.otpService.verifyAccessToken(accessToken);

    const extractMobileFromMsg91 = (res: any): string | null => {
      if (!res) return null;
      if (typeof res?.message === 'string' && res.message.trim().length >= 10) {
        return res.message.trim();
      }
      if (res?.data && typeof res.data === 'object' && res.data.mobile) {
        return String(res.data.mobile).trim();
      }
      if (res?.mobile) {
        return String(res.mobile).trim();
      }
      if (typeof res?.data === 'string' && res.data.trim().length >= 10) {
        return res.data.trim();
      }
      if (res?.message && typeof res.message === 'object' && res.message.mobile) {
        return String(res.message.mobile).trim();
      }
      if (res?.phone) {
        return String(res.phone).trim();
      }
      return null;
    };

    const rawMobile = extractMobileFromMsg91(msg91Data);
    this.logger.log(`[Backend MSG91] Extracted mobile present=${!!rawMobile}`);

    let phoneToVerify = String(rawMobile || '').trim();
    if (!phoneToVerify) {
      this.logger.error(`[Backend MSG91] Mobile number missing in MSG91 payload response.`);
      throw new BadRequestException('Mobile number not returned from MSG91 widget verification');
    }

    if (!phoneToVerify.startsWith('+')) {
      if (phoneToVerify.length === 10) {
        phoneToVerify = `+91${phoneToVerify}`;
      } else {
        phoneToVerify = `+${phoneToVerify}`;
      }
    }

    let user = await this.usersService.findUserByPhone(phoneToVerify);
    const normalizedTarget = (targetRole || 'CUSTOMER').toUpperCase();

    if (!user) {
      if (normalizedTarget === 'CUSTOMER') {
        this.logger.log(`[Backend MSG91] User not found for phone. Auto-registering CUSTOMER...`);
        const dummyPassword = await bcrypt.hash(`Customer@${Date.now()}`, 12);
        user = await this.usersService.createUser(phoneToVerify, dummyPassword, UserRole.CUSTOMER);
      } else {
        this.logger.warn(`[Backend MSG91] Rejected: No user found for phone ${phoneToVerify} targeting ${normalizedTarget}`);
        throw new UnauthorizedException(`No authorized ${normalizedTarget.toLowerCase()} account found for this phone number.`);
      }
    }

    const restaurant = await this.enforceUserRoleAndStatus(user, targetRole);

    this.logger.log(`[Backend MSG91] User authenticated with ID=${user.id}, role=${user.role}. Creating session & tokens...`);
    const session = await this.sessionService.createSession(user.id, ipAddress, userAgent);
    const tokens = await this.tokenService.generateTokenPair(
      {
        ...user,
        restaurantId: restaurant?.id,
      },
      session.id,
    );

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

  async verifyOtp(dto: VerifyOtpDto, ipAddress?: string, userAgent?: string) {
    if (dto.accessToken) {
      return this.verifyWidgetToken(dto.accessToken, dto.targetRole, ipAddress, userAgent);
    }

    if (!dto.phone || !dto.otp) {
      throw new BadRequestException('Phone number and OTP code are required');
    }

    const formattedPhone = dto.phone.startsWith('+')
      ? dto.phone
      : dto.phone.length === 10
      ? `+91${dto.phone}`
      : `+${dto.phone}`;

    await this.otpService.verifyOtp(formattedPhone, dto.otp);
    const phoneToVerify = formattedPhone;

    let user = await this.usersService.findUserByPhone(phoneToVerify);
    const normalizedTarget = (dto.targetRole || 'CUSTOMER').toUpperCase();

    if (!user) {
      if (normalizedTarget === 'CUSTOMER') {
        const dummyPassword = await bcrypt.hash(`Customer@${Date.now()}`, 12);
        user = await this.usersService.createUser(phoneToVerify, dummyPassword, UserRole.CUSTOMER);
      } else {
        throw new UnauthorizedException(`No authorized ${normalizedTarget.toLowerCase()} account found for this phone number.`);
      }
    }

    const restaurant = await this.enforceUserRoleAndStatus(user, dto.targetRole);

    const session = await this.sessionService.createSession(user.id, ipAddress, userAgent);
    const tokens = await this.tokenService.generateTokenPair(
      {
        ...user,
        restaurantId: restaurant?.id,
      },
      session.id,
    );

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
        rObj = await (this.usersService as any).prisma?.restaurant?.findFirst({
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
    const tokens = await this.tokenService.generateTokenPair(
      {
        ...user,
        restaurantId: restaurant?.id,
      },
      session.id,
    );

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
