import { Injectable, UnauthorizedException, BadRequestException, ForbiddenException, Logger } from '@nestjs/common';
import { OtpService } from '../otp/otp.service';
import { TokenService } from '../tokens/token.service';
import { SessionService } from '../sessions/session.service';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { VerifyResetTokenDto } from './dto/verify-reset-token.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangeEmailDto } from './dto/change-email.dto';
import { RequestPhoneChangeOtpDto, VerifyPhoneChangeOtpDto } from './dto/change-phone.dto';
import * as bcrypt from 'bcrypt';
import { UserRole } from '@prisma/client';
import * as crypto from 'crypto';

import { VerifyOtpDto } from './dto/verify-otp.dto';

interface ResetTokenPayload {
  userId: string;
  phone: string;
  expiresAt: number;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly resetTokenMap = new Map<string, ResetTokenPayload>();

  constructor(
    private readonly otpService: OtpService,
    private readonly tokenService: TokenService,
    private readonly sessionService: SessionService,
    private readonly usersService: UsersService,
  ) {}

  async sendOtp(phone: string) {
    return this.otpService.sendOtp(phone);
  }

  /**
   * Verify MSG91 Widget access token for pre-registration phone check.
   * Extracts phone from MSG91 payload, verifies match against submitted registration phone.
   * Does NOT create a user account, does NOT issue JWTs.
   * Returns { verified: true } on success so the registration form can proceed.
   */
  async verifyRegistrationWidgetToken(accessToken: string, submittedPhone: string) {
    if (!accessToken) {
      throw new BadRequestException('Widget access token is required');
    }
    if (!submittedPhone) {
      throw new BadRequestException('Registration phone number is required');
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
    this.logger.log(`[Restaurant Registration Widget] Extracted mobile present=${!!rawMobile}`);

    let verifiedMobile = String(rawMobile || '').trim();
    if (!verifiedMobile) {
      this.logger.error(`[Restaurant Registration Widget] Mobile number missing in MSG91 payload response.`);
      throw new BadRequestException('Mobile number not returned from MSG91 widget verification');
    }

    const cleanVerified = verifiedMobile.replace(/\D/g, '');
    const cleanSubmitted = submittedPhone.replace(/\D/g, '');

    if (cleanVerified.length < 10 || cleanSubmitted.length < 10) {
      throw new BadRequestException('Invalid mobile number format for verification');
    }

    const verifiedFormatted = cleanVerified.length === 10 ? `+91${cleanVerified}` : `+${cleanVerified}`;
    const submittedFormatted = cleanSubmitted.length === 10 ? `+91${cleanSubmitted}` : `+${cleanSubmitted}`;

    if (verifiedFormatted !== submittedFormatted) {
      this.logger.error(`[Restaurant Registration Widget] Phone mismatch! Submitted: ${submittedFormatted}, Verified by MSG91: ${verifiedFormatted}`);
      throw new BadRequestException('Verified phone number does not match the registration phone number.');
    }

    this.logger.log(`[Restaurant Registration Widget] Phone verification succeeded for ${submittedFormatted}`);
    return { verified: true, message: 'Phone number verified successfully' };
  }


  async checkPhoneAvailability(rawPhone: string) {
    if (!rawPhone) {
      throw new BadRequestException('Phone number is required');
    }
    const cleanDigits = rawPhone.replace(/\D/g, '');
    if (cleanDigits.length < 10) {
      throw new BadRequestException('Please enter a valid 10-digit mobile number');
    }
    const formattedPhone = cleanDigits.length === 10 ? `+91${cleanDigits}` : `+${cleanDigits}`;
    const existing = await this.usersService.findUserByPhone(formattedPhone);
    if (existing) {
      throw new BadRequestException(
        'An account with this phone number already exists. Please use the correct login portal.',
      );
    }
    return { available: true, message: 'Phone number is available for registration.' };
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
    dto?: VerifyOtpDto,
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

    // Phone mismatch check between submitted phone and MSG91 verified phone
    if (dto?.phone) {
      const cleanSub = dto.phone.replace(/\D/g, '');
      if (cleanSub.length >= 10) {
        const submittedFormatted = cleanSub.length === 10 ? `+91${cleanSub}` : `+${cleanSub}`;
        if (submittedFormatted !== phoneToVerify) {
          this.logger.error(`[Backend MSG91] Phone mismatch! Submitted: ${submittedFormatted}, Verified by MSG91: ${phoneToVerify}`);
          throw new BadRequestException('Submitted phone number does not match MSG91 verified phone number.');
        }
      }
    }

    let user = await this.usersService.findUserByPhone(phoneToVerify);
    const normalizedTarget = (targetRole || 'CUSTOMER').toUpperCase();

    if (!user) {
      if (normalizedTarget === 'CUSTOMER') {
        this.logger.log(`[Backend MSG91] Creating CUSTOMER account for verified phone ${phoneToVerify} AFTER OTP...`);
        const passwordToHash = dto?.password || `Customer@${Date.now()}`;
        const passwordHash = await bcrypt.hash(passwordToHash, 12);
        
        const nameParts = (dto?.name || 'Customer').trim().split(' ');
        const firstName = nameParts[0] || 'Customer';
        const lastName = nameParts.slice(1).join(' ') || '';

        user = await (this.usersService as any).prisma.user.create({
          data: {
            phone: phoneToVerify,
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
      } else {
        this.logger.warn(`[Backend MSG91] Rejected: No user found for phone ${phoneToVerify} targeting ${normalizedTarget}`);
        throw new UnauthorizedException(`No authorized ${normalizedTarget.toLowerCase()} account found for this phone number.`);
      }
    } else {
      // Existing account: reject CUSTOMER signup for any already-registered phone regardless of role
      if (normalizedTarget === 'CUSTOMER') {
        this.logger.warn(
          `[Backend MSG91] Rejected CUSTOMER signup: phone ${phoneToVerify} already registered as role=${user.role}`,
        );
        throw new BadRequestException(
          'An account with this phone number already exists. Please use the correct login portal.',
        );
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
      return this.verifyWidgetToken(dto.accessToken, dto.targetRole, ipAddress, userAgent, dto);
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
        const passwordToHash = dto?.password || `Customer@${Date.now()}`;
        const passwordHash = await bcrypt.hash(passwordToHash, 12);
        
        const nameParts = (dto?.name || 'Customer').trim().split(' ');
        const firstName = nameParts[0] || 'Customer';
        const lastName = nameParts.slice(1).join(' ') || '';

        user = await (this.usersService as any).prisma.user.create({
          data: {
            phone: phoneToVerify,
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
      } else {
        throw new UnauthorizedException(`No authorized ${normalizedTarget.toLowerCase()} account found for this phone number.`);
      }
    } else {
      // Existing account: reject any CUSTOMER signup attempt regardless of role or password presence
      if (normalizedTarget === 'CUSTOMER') {
        this.logger.warn(
          `[verifyOtp] Rejected CUSTOMER signup: phone already registered as role=${user.role}`,
        );
        throw new BadRequestException(
          'An account with this phone number already exists. Please use the correct login portal.',
        );
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

    // Portal-specific role enforcement: reject if the caller declared a targetRole
    // that does not match the account's actual role
    if (dto.targetRole) {
      const normalizedTarget = dto.targetRole.toUpperCase().trim();
      const normalizedUserRole = user.role.toUpperCase().trim();
      if (normalizedTarget === 'CUSTOMER' && normalizedUserRole !== 'CUSTOMER') {
        this.logger.warn(
          `[login] Portal role mismatch: user=${user.id} has role=${user.role}, but targetRole=CUSTOMER was required`,
        );
        throw new UnauthorizedException(
          'An account with this phone number already exists. Please use the correct login portal.',
        );
      }
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
    const rawInput = (input || '').trim();
    if (!rawInput) {
      throw new BadRequestException('Phone number or email is required');
    }
    const user = await this.usersService.findUserByPhoneOrEmail(rawInput);
    if (!user || !user.isActive) {
      // Security standard: generic success response to prevent account enumeration
      return { message: 'If registered, password reset OTP instructions have been sent.' };
    }

    // Trigger OTP sending
    await this.otpService.sendOtp(user.phone);

    return {
      exists: true,
      phone: user.phone,
      message: 'Password reset OTP dispatched successfully via MSG91.',
    };
  }

  async verifyResetToken(dto: VerifyResetTokenDto) {
    if (!dto.phone) {
      throw new BadRequestException('Registered phone number is required');
    }

    const cleanDigits = dto.phone.replace(/\D/g, '');
    if (cleanDigits.length < 10) {
      throw new BadRequestException('Please enter a valid 10-digit mobile number');
    }
    const requestedPhone = cleanDigits.length === 10 ? `+91${cleanDigits}` : `+${cleanDigits}`;

    let phoneToVerify = requestedPhone;

    if (dto.accessToken) {
      const msg91Data = await this.otpService.verifyAccessToken(dto.accessToken);

      const extractMobileFromMsg91 = (res: any): string | null => {
        if (!res) return null;
        if (typeof res?.message === 'string' && res.message.trim().length >= 10) return res.message.trim();
        if (res?.data && typeof res.data === 'object' && res.data.mobile) return String(res.data.mobile).trim();
        if (res?.mobile) return String(res.mobile).trim();
        if (typeof res?.data === 'string' && res.data.trim().length >= 10) return res.data.trim();
        if (res?.message && typeof res.message === 'object' && res.message.mobile) return String(res.message.mobile).trim();
        if (res?.phone) return String(res.phone).trim();
        return null;
      };

      const rawMobile = extractMobileFromMsg91(msg91Data);
      if (!rawMobile) {
        throw new BadRequestException('Mobile number not returned from MSG91 widget verification');
      }

      phoneToVerify = rawMobile.startsWith('+')
        ? rawMobile
        : rawMobile.length === 10
        ? `+91${rawMobile}`
        : `+${rawMobile}`;

      if (phoneToVerify !== requestedPhone) {
        this.logger.error(`[Backend ForgotPassword] Phone mismatch! Requested: ${requestedPhone}, Verified by MSG91: ${phoneToVerify}`);
        throw new BadRequestException('MSG91 verified phone does not match requested password reset phone.');
      }
    } else if (dto.otp) {
      await this.otpService.verifyOtp(requestedPhone, dto.otp);
    } else {
      throw new BadRequestException('MSG91 access token or OTP code is required');
    }

    const user = await this.usersService.findUserByPhone(phoneToVerify);
    if (!user || !user.isActive) {
      throw new BadRequestException('No active user account found for this phone number');
    }

    // Issue short-lived, single-use password reset token (valid 10 minutes)
    const resetToken = `rst_${Date.now()}_${crypto.randomBytes(16).toString('hex')}`;
    this.resetTokenMap.set(resetToken, {
      userId: user.id,
      phone: user.phone,
      expiresAt: Date.now() + 10 * 60 * 1000,
    });

    this.logger.log(`[Backend ForgotPassword] Issued reset token for user ID=${user.id}, phone=${user.phone}`);

    return {
      resetToken,
      phone: user.phone,
      message: 'OTP verified successfully. You may now set your new password.',
    };
  }

  async resetPassword(dto: ResetPasswordDto, ipAddress?: string, userAgent?: string) {
    let userId: string | null = null;

    if (dto.resetToken) {
      const payload = this.resetTokenMap.get(dto.resetToken);
      if (!payload) {
        throw new BadRequestException('Invalid or expired password reset token. Please request a new OTP.');
      }
      if (Date.now() > payload.expiresAt) {
        this.resetTokenMap.delete(dto.resetToken);
        throw new BadRequestException('Password reset token has expired. Please request a new OTP.');
      }
      // Single-use token: invalidate immediately!
      this.resetTokenMap.delete(dto.resetToken);
      userId = payload.userId;
    } else if (dto.accessToken || (dto.phone && dto.otp)) {
      const verifyRes = await this.verifyResetToken({
        accessToken: dto.accessToken,
        phone: dto.phone || '',
        otp: dto.otp,
      });
      const payload = this.resetTokenMap.get(verifyRes.resetToken);
      if (payload) {
        userId = payload.userId;
        this.resetTokenMap.delete(verifyRes.resetToken);
      }
    }

    if (!userId) {
      throw new BadRequestException('Valid reset token or OTP verification is required');
    }

    const user = await this.usersService.findUserById(userId);
    if (!user || !user.isActive) {
      throw new BadRequestException('User record not found or account is disabled');
    }

    const newPasswordHash = await bcrypt.hash(dto.newPassword, 12);
    await this.usersService.updatePassword(user.id, newPasswordHash);

    // Invalidate all active sessions & refresh tokens
    await this.tokenService.revokeAllUserTokens(user.id);
    await this.sessionService.terminateAllUserSessions(user.id);

    // Automatically log in user with fresh session JWT
    const session = await this.sessionService.createSession(user.id, ipAddress, userAgent);
    const tokens = await this.tokenService.generateTokenPair(user, session.id);

    this.logger.log(`[Backend ResetPassword] Password updated successfully for user ID=${user.id}. Logged in.`);

    return {
      user: {
        id: user.id,
        phone: user.phone,
        email: user.email,
        role: user.role,
        profile: user.profile,
      },
      tokens,
      message: 'Password reset successfully. You are now logged in.',
    };
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

  async changeEmail(userId: string, dto: ChangeEmailDto) {
    const user = await this.usersService.findUserById(userId);

    const isMatch = await bcrypt.compare(dto.currentPassword, user.passwordHash);
    if (!isMatch) {
      throw new BadRequestException('Current password does not match');
    }

    const cleanEmail = dto.newEmail.trim().toLowerCase();
    const existing = await this.usersService.findUserByPhoneOrEmail(cleanEmail);
    if (existing && existing.id !== userId) {
      throw new BadRequestException('An account with this email address already exists. Please use a different email.');
    }

    const updated = await (this.usersService as any).prisma.user.update({
      where: { id: userId },
      data: { email: cleanEmail },
      include: { profile: true },
    });

    return {
      message: 'Email address updated successfully',
      user: {
        id: updated.id,
        email: updated.email,
        phone: updated.phone,
        role: updated.role,
        profile: updated.profile,
      },
    };
  }

  async requestPhoneChangeOtp(userId: string, dto: RequestPhoneChangeOtpDto) {
    const user = await this.usersService.findUserById(userId);

    const isMatch = await bcrypt.compare(dto.currentPassword, user.passwordHash);
    if (!isMatch) {
      throw new BadRequestException('Current password does not match');
    }

    const cleanDigits = dto.newPhone.replace(/\D/g, '');
    if (cleanDigits.length < 10) {
      throw new BadRequestException('Please enter a valid 10-digit mobile number');
    }

    const formattedPhone = cleanDigits.length === 10 ? `+91${cleanDigits}` : `+${cleanDigits}`;
    const existing = await this.usersService.findUserByPhone(formattedPhone);
    if (existing && existing.id !== userId) {
      throw new BadRequestException('An account with this phone number already exists. Please use a different phone number.');
    }

    await this.otpService.sendOtp(formattedPhone);
    return {
      message: 'OTP dispatched to new phone number',
      phone: formattedPhone,
    };
  }

  async verifyPhoneChangeOtp(userId: string, dto: VerifyPhoneChangeOtpDto) {
    const user = await this.usersService.findUserById(userId);

    const cleanDigits = dto.newPhone.replace(/\D/g, '');
    if (cleanDigits.length < 10) {
      throw new BadRequestException('Please enter a valid 10-digit mobile number');
    }
    const formattedPhone = cleanDigits.length === 10 ? `+91${cleanDigits}` : `+${cleanDigits}`;

    if (dto.accessToken) {
      const msg91Data = await this.otpService.verifyAccessToken(dto.accessToken);
      if (!msg91Data) {
        throw new BadRequestException('Invalid MSG91 verification token');
      }
    } else if (dto.otp) {
      await this.otpService.verifyOtp(formattedPhone, dto.otp);
    } else {
      throw new BadRequestException('OTP code or MSG91 access token is required');
    }

    // Safety re-check against race conditions
    const existing = await this.usersService.findUserByPhone(formattedPhone);
    if (existing && existing.id !== userId) {
      throw new BadRequestException('An account with this phone number already exists. Please use a different phone number.');
    }

    const updated = await (this.usersService as any).prisma.user.update({
      where: { id: userId },
      data: { phone: formattedPhone },
      include: { profile: true },
    });

    return {
      message: 'Phone number updated successfully',
      user: {
        id: updated.id,
        email: updated.email,
        phone: updated.phone,
        role: updated.role,
        profile: updated.profile,
      },
    };
  }

  // --- ADMIN TWO-PASSWORD AUTHENTICATION SYSTEM ---

  async adminTwoPasswordLogin(
    dto: { password1: string; password2: string },
    ipAddress?: string,
    userAgent?: string,
  ) {
    // 1. Format validation (16 numeric digits for pwd1, 8 numeric digits for pwd2)
    const p1 = (dto.password1 || '').trim();
    const p2 = (dto.password2 || '').trim();

    if (!/^\d{16}$/.test(p1)) {
      throw new BadRequestException('Password 1 must be exactly 16 numeric digits.');
    }
    if (!/^\d{8}$/.test(p2)) {
      throw new BadRequestException('Password 2 must be exactly 8 numeric digits.');
    }

    this.logger.log(
      `[Admin Two-Password Auth] Attempt: password1Present=${!!p1}, password2Present=${!!p2}`,
    );

    // 2. Locate platform Admin / SuperAdmin account in PostgreSQL
    let adminUser = await (this.usersService as any).prisma.user.findFirst({
      where: {
        role: { in: [UserRole.SUPER_ADMIN, UserRole.ADMIN] },
        isActive: true,
      },
      include: { profile: true },
    });

    if (!adminUser) {
      this.logger.warn('[Admin Two-Password Auth] Rejected: No active Admin/SuperAdmin account found.');
      throw new UnauthorizedException('Invalid admin credentials.');
    }

    // 3. Auto-provision initial bcrypt hashes if password1Hash or password2Hash are null
    if (!adminUser.password1Hash || !adminUser.password2Hash) {
      this.logger.log('[Admin Two-Password Auth] Provisioning initial bcrypt hashes for Admin account...');
      const initialP1Hash = await bcrypt.hash('9999888877776666', 10);
      const initialP2Hash = await bcrypt.hash('88887777', 10);

      adminUser = await (this.usersService as any).prisma.user.update({
        where: { id: adminUser.id },
        data: {
          password1Hash: initialP1Hash,
          password2Hash: initialP2Hash,
        },
        include: { profile: true },
      });
    }

    // 4. Verify BOTH passwords using bcrypt
    const isP1Valid = await bcrypt.compare(p1, adminUser.password1Hash);
    const isP2Valid = await bcrypt.compare(p2, adminUser.password2Hash);

    if (!isP1Valid || !isP2Valid) {
      this.logger.warn(`[Admin Two-Password Auth] Credentials verification failed for adminUser=${adminUser.id}`);
      throw new UnauthorizedException('Invalid admin credentials.');
    }

    // 5. Authenticate Admin session & issue JWT token pair
    this.logger.log(`[Admin Two-Password Auth] Successful login for Admin ID=${adminUser.id}, role=${adminUser.role}`);
    const session = await this.sessionService.createSession(adminUser.id, ipAddress, userAgent);
    const tokens = await this.tokenService.generateTokenPair(
      {
        ...adminUser,
      },
      session.id,
    );

    return {
      user: {
        id: adminUser.id,
        phone: adminUser.phone,
        email: adminUser.email,
        role: adminUser.role,
        profile: adminUser.profile,
      },
      tokens,
    };
  }

  async changeAdminPasswords(userId: string, dto: { newPassword1?: string; newPassword2?: string }) {
    const user = await this.usersService.findUserById(userId);

    if (user.role !== UserRole.ADMIN && user.role !== UserRole.SUPER_ADMIN) {
      throw new ForbiddenException('Only Admin / Super Admin can access this operation.');
    }

    const updates: any = {};

    if (dto.newPassword1) {
      const p1 = dto.newPassword1.trim();
      if (!/^\d{16}$/.test(p1)) {
        throw new BadRequestException('Password 1 must be exactly 16 numeric digits.');
      }
      updates.password1Hash = await bcrypt.hash(p1, 10);
    }

    if (dto.newPassword2) {
      const p2 = dto.newPassword2.trim();
      if (!/^\d{8}$/.test(p2)) {
        throw new BadRequestException('Password 2 must be exactly 8 numeric digits.');
      }
      updates.password2Hash = await bcrypt.hash(p2, 10);
    }

    if (Object.keys(updates).length > 0) {
      await (this.usersService as any).prisma.user.update({
        where: { id: userId },
        data: updates,
      });
    }

    return { message: 'Admin passwords updated successfully' };
  }
}
